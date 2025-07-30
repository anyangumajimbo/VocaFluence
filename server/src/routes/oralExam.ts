import express, { Request, Response, NextFunction, Router } from 'express';
import { OpenAI } from 'openai';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import delfB2Questions from '../data/delfB2Questions';
import OralExamSession from '../models/OralExamSession';
import mongoose from 'mongoose';
import ffmpeg from 'fluent-ffmpeg';
import stream from 'stream';

// Explicitly set FFmpeg path for Windows
if (process.platform === 'win32') {
    ffmpeg.setFfmpegPath('C:\\ffmpeg\\bin\\ffmpeg.exe');
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

// Define your own Message type for MongoDB
interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

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
        // Create a proper ObjectId for the user
        const userId = new mongoose.Types.ObjectId();
        const question = delfB2Questions[Math.floor(Math.random() * delfB2Questions.length)];
        const messages: Message[] = [
            { role: 'system', content: DELF_B2_SYSTEM_PROMPT },
            { role: 'user', content: `Sujet de l'examen : ${question}` }
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
        // If evaluation is present in AI message, extract and save (simple check)
        if (/Cohérence|Richesse du vocabulaire|Correction grammaticale|Prononciation|points forts|axes d'amélioration|commentaire global/i.test(aiMessage)) {
            session.evaluation = { commentaireGlobal: aiMessage };
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
router.post('/tts', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
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
            const transcription = await openai.audio.transcriptions.create({
                file: new Blob([audioBuffer], { type: finalMimeType }),
                model: "whisper-1",
                language: "fr" // French for DELF B2
            });

            console.log('Transcription successful:', transcription.text);

            // Clean up uploaded file
            await fs.remove(req.file.path);

            res.json({
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
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router; 