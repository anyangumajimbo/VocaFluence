import express, { Request, Response, NextFunction, Router } from 'express';
import { OpenAI } from 'openai';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import OralExamSession from '../models/OralExamSession';
import ffmpeg from 'fluent-ffmpeg';
import stream from 'stream';
import { authMiddleware } from '../middleware/auth';
import { ActivityLog } from '../models/ActivityLog';

// Set FFmpeg path - try system PATH first, then fallback to common Windows location
if (process.platform === 'win32') {
    // Try to use FFmpeg from system PATH
    try {
        ffmpeg.setFfmpegPath('ffmpeg'); // Use from PATH
    } catch (error) {
        // Fallback to common Windows installation
        ffmpeg.setFfmpegPath('C:\\ffmpeg\\bin\\ffmpeg.exe');
    }
}

// Helper function to convert audio to MP3 using FFmpeg
const convertToMP3 = (filePath: string): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const outputChunks: Buffer[] = [];

        ffmpeg(filePath)
            .audioCodec('libmp3lame')
            .audioBitrate(128)
            .audioChannels(1)
            .audioFrequency(16000)
            .toFormat('mp3')
            .on('error', (error) => {
                console.error('FFmpeg error:', error);
                reject(error);
            })
            .on('end', () => {
                const mp3Buffer = Buffer.concat(outputChunks);
                console.log('FFmpeg conversion completed, buffer size:', mp3Buffer.length);
                resolve(mp3Buffer);
            })
            .pipe()
            .on('data', (chunk: Buffer) => {
                outputChunks.push(chunk);
            });
    });
};

const router: Router = express.Router();
router.use(authMiddleware);

// Define your own Message type for MongoDB
interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface EvaluationData {
    coherence?: number;
    vocabulaire?: number;
    grammaire?: number;
    prononciation?: number;
    totalScore?: number;
    pointsForts?: string[];
    axesAmelioration?: string[];
    commentaireGlobal?: string;
}

const extractEvaluation = (message: string): EvaluationData => {
    const evaluation: EvaluationData = {};

    const scorePatterns: Record<string, RegExp> = {
        coherence: /coh[ée]rence\s*:?\s*(\d+)/i,
        vocabulaire: /vocabulaire\s*:?\s*(\d+)/i,
        grammaire: /grammaire\s*:?\s*(\d+)/i,
        prononciation: /prononciation\s*:?\s*(\d+)/i,
        totalScore: /total\s*:?\s*(\d+)/i
    };

    Object.entries(scorePatterns).forEach(([key, pattern]) => {
        const match = message.match(pattern);
        if (match) {
            (evaluation as any)[key] = parseInt(match[1], 10);
        }
    });

    const pointsFortsMatch = message.match(/points forts\s*:?\s*([^\n]+)/i);
    if (pointsFortsMatch) {
        evaluation.pointsForts = pointsFortsMatch[1].split(',').map(p => p.trim()).filter(Boolean);
    }

    const axesMatch = message.match(/axes d['’]am[ée]lioration\s*:?\s*([^\n]+)/i);
    if (axesMatch) {
        evaluation.axesAmelioration = axesMatch[1].split(',').map(a => a.trim()).filter(Boolean);
    }

    evaluation.commentaireGlobal = message;

    if (!evaluation.totalScore) {
        const scores = [evaluation.coherence, evaluation.vocabulaire, evaluation.grammaire, evaluation.prononciation]
            .filter((v): v is number => typeof v === 'number');
        if (scores.length > 0) {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            evaluation.totalScore = Math.round(avg * 20); // scale 0-5 -> 0-100
        }
    }

    return evaluation;
};

const DELF_B2_SYSTEM_PROMPT = `
Vous êtes examinateur officiel du DELF B2. Vous suivez strictement la structure de l'épreuve orale :
1. Accueil et explication rapide du déroulement (en français, 1-2 phrases).
2. Présentation du sujet à l'étudiant (en français, 1 phrase, puis posez la question sélectionnée).
3. Débattez avec l'étudiant, posez des questions de relance, jouez le rôle d'examinateur officiel, restez neutre et professionnel.
4. À la fin, fournissez une évaluation structurée :
- Notez sur 5 : Cohérence, Richesse du vocabulaire, Correction grammaticale, Prononciation.
- Donnez 2 points forts et 2 axes d'amélioration.
- Terminez par un commentaire global.
Toutes vos interventions sont en français. Ne révélez jamais la liste des sujets. Ne sortez jamais de votre rôle d'examinateur.
`;

const upload = multer({ dest: 'uploads/' }); // Saves to disk

// POST /api/oral-exam/session (start new session)
router.post('/session', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user._id;
        
        // Get topic data from frontend request
        const { questionTitle, questionText, source, topicId } = req.body;
        
        // Use the topic title or create a formatted question
        const question = questionTitle || `Topic: ${topicId}`;
        
        // Create system prompt with the actual topic content
        const systemPromptWithTopic = `
Vous êtes examinateur officiel du DELF B2. Vous suivez strictement la structure de l'épreuve orale :

SUJET DE L'ÉTUDIANT:
${questionTitle || 'N/A'}

CONTENU DU SUJET:
${questionText || 'N/A'}

Votre rôle:
1. Accueil et explication rapide du déroulement (en français, 1-2 phrases).
2. Invitez l'étudiant à présenter et discuter du sujet donné (en français).
3. Posez des questions de relance pertinentes sur le sujet, jouez le rôle d'examinateur officiel, restez neutre et professionnel.
4. À la fin, fournissez une évaluation structurée :
   - Notez sur 5 : Cohérence, Richesse du vocabulaire, Correction grammaticale, Prononciation.
   - Donnez 2 points forts et 2 axes d'amélioration.
   - Terminez par un commentaire global.

Toutes vos interventions sont en français. Restez dans votre rôle d'examinateur.
`;
        
        const messages: Message[] = [
            { role: 'system', content: systemPromptWithTopic },
            { role: 'user', content: `Sujet de l'examen : ${questionTitle || 'Topic selected'}` }
        ];
        
        // Prepare messages for OpenAI
        const openAIMessages: ChatCompletionMessageParam[] = messages.map(m => ({
            role: m.role,
            content: m.content
        }));
        
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: openAIMessages,
            temperature: 0.7,
            max_tokens: 512
        });
        
        const aiMessage = completion.choices[0]?.message?.content || '';
        messages.push({ role: 'assistant', content: aiMessage });
        
        // Save session
        const session = new OralExamSession({
            user: userId,
            question,
            topicId: topicId || null,
            messages
        });
        
        await session.save();
        
        return res.status(201).json({
            sessionId: session._id,
            question,
            aiMessage
        });
    } catch (error) {
        next(error);
        return;
    }
});

// POST /api/oral-exam/session/:sessionId/message (continue conversation)
router.post('/session/:sessionId/message', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // For now, we'll use the sessionId to find the session without user filtering
        const { sessionId } = req.params;
        const { userMessage } = req.body;
        const session = await OralExamSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found.' });
        }
        // Add user message (Message type)
        session.messages.push({ role: 'user', content: userMessage });
        // Prepare messages for OpenAI
        const openAIMessages: ChatCompletionMessageParam[] = session.messages.map(m => ({
            role: m.role,
            content: m.content
        }));
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: openAIMessages,
            temperature: 0.7,
            max_tokens: 512
        });
        const aiMessage = completion.choices[0]?.message?.content || '';
        session.messages.push({ role: 'assistant', content: aiMessage });
        // If evaluation is present in AI message, extract and save
        if (/Coh[ée]rence|Richesse du vocabulaire|Correction grammaticale|Prononciation|points forts|axes d['’]am[ée]lioration|commentaire global|total/i.test(aiMessage)) {
            const evaluation = extractEvaluation(aiMessage);
            session.evaluation = evaluation;

            if (!session.evaluationSaved) {
                const durationSeconds = Math.max(0, Math.floor((Date.now() - new Date(session.createdAt).getTime()) / 1000));
                const scoreValue = evaluation.totalScore ?? undefined;

                const activityLog = new ActivityLog({
                    userId: session.user,
                    activityType: 'oral_exam',
                    title: session.question,
                    description: 'Oral exam session completed',
                    textContent: session.question,
                    score: scoreValue,
                    duration: durationSeconds,
                    transcript: userMessage,
                    feedback: aiMessage,
                    relatedId: session._id
                });

                await activityLog.save();
                session.evaluationSaved = true;
            }
        }
        await session.save();
        return res.json({ aiMessage, sessionId });
    } catch (error) {
        next(error);
        return;
    }
});

// GET /api/oral-exam/sessions (list user's sessions)
router.get('/sessions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // For now, return all sessions since we're not filtering by user
        const sessions = await OralExamSession.find().sort({ createdAt: -1 });
        return res.json({ sessions });
    } catch (error) {
        next(error);
        return;
    }
});

// GET /api/oral-exam/session/:sessionId (get single session)
router.get('/session/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;
        const session = await OralExamSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found.' });
        }
        return res.json({ session });
    } catch (error) {
        next(error);
        return;
    }
});

// AI Text-to-Speech endpoint
router.post('/tts', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { text, voice = 'onyx' } = req.body;
        if (!text) {
            return res.status(400).json({ message: 'Text is required for TTS.' });
        }
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.audio.speech.create({
            model: 'tts-1',
            input: text,
            voice,
            response_format: 'mp3'
        });
        const buffer = Buffer.from(await response.arrayBuffer());
        res.setHeader('Content-Type', 'audio/mpeg');
        return res.send(buffer);
    } catch (error) {
        console.error('TTS error:', error);
        next(error);
        return;
    }
});

// Transcribe audio endpoint with dual processing
router.post('/transcribe', upload.single('audio'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const requiresConversion = req.body.requiresConversion === 'true';
        const platform = req.body.platform || 'unknown';
        const originalMimeType = req.file.mimetype;

        console.log('Transcription request:', {
            filename: req.file.filename,
            originalMimeType: originalMimeType,
            requiresConversion: requiresConversion,
            platform: platform,
            fileSize: req.file.size
        });

        let audioBuffer: Buffer;
        let finalMimeType: string;

        if (requiresConversion) {
            // Method B: Convert audio using FFmpeg
            console.log('Converting audio using FFmpeg...');

            try {
                // Convert to MP3 using FFmpeg
                const mp3Buffer = await convertToMP3(req.file.path);
                audioBuffer = mp3Buffer;
                finalMimeType = 'audio/mpeg';

                console.log('FFmpeg conversion successful');
            } catch (ffmpegError) {
                console.error('FFmpeg conversion failed:', ffmpegError);
                return res.status(500).json({
                    error: 'Audio conversion failed',
                    details: ffmpegError instanceof Error ? ffmpegError.message : 'Unknown error'
                });
            }
        } else {
            // Method A: Use audio directly (WebM)
            console.log('Using audio directly without conversion...');

            try {
                audioBuffer = await fs.readFile(req.file.path);
                finalMimeType = originalMimeType;

                console.log('Direct audio processing successful');
            } catch (readError) {
                console.error('Audio file read failed:', readError);
                return res.status(500).json({
                    error: 'Failed to read audio file',
                    details: readError instanceof Error ? readError.message : 'Unknown error'
                });
            }
        }

        // Send to OpenAI Whisper
        console.log('Sending to OpenAI Whisper...');

        try {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            
            // Create a proper File object for OpenAI Whisper
            const file = new File([audioBuffer], 'audio.webm', { type: finalMimeType });
            
            const transcription = await openai.audio.transcriptions.create({
                file: file,
                model: "whisper-1",
                language: "fr" // French for DELF B2
            });

            console.log('Transcription successful:', transcription.text);

            // Clean up uploaded file
            await fs.remove(req.file.path);

            return res.json({
                transcript: transcription.text,
                processingMethod: requiresConversion ? 'FFmpeg Conversion' : 'Direct Processing',
                platform: platform,
                originalFormat: originalMimeType,
                finalFormat: finalMimeType
            });

        } catch (whisperError) {
            console.error('OpenAI Whisper error:', whisperError);

            // Clean up uploaded file
            await fs.remove(req.file.path);

            return res.status(500).json({
                error: 'Transcription failed',
                details: whisperError instanceof Error ? whisperError.message : 'Unknown error'
            });
        }

    } catch (error) {
        console.error('Transcription endpoint error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router; 