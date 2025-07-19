import express, { Request, Response, NextFunction, Router } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import { PracticeSession } from '../models/PracticeSession';
import { Script } from '../models/Script';
import AIService from '../services/aiService';

const router: Router = express.Router();

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB limit for audio files
    },
    fileFilter: (req, file, cb) => {
        // Accept audio files
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'));
        }
    }
});

// Start practice session
router.post('/start', [
    authMiddleware,
    body('scriptId').isMongoId(),
    body('language').isIn(['english', 'french', 'swahili'])
], async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { scriptId, language } = req.body;
        const userId = (req as any).user._id;

        // Verify script exists
        const script = await Script.findById(scriptId);
        if (!script) {
            res.status(404).json({ message: 'Script not found.' });
            return;
        }

        // Create practice session
        const session = new PracticeSession({
            userId,
            scriptId,
            score: 0,
            accuracy: 0,
            fluency: 0,
            duration: 0
        });

        await session.save();

        res.status(201).json({
            message: 'Practice session started.',
            session: {
                id: session._id,
                scriptId: session.scriptId,
                language
            }
        });
    } catch (error) {
        next(error);
    }
});

// Submit practice results with audio transcription
router.post('/submit', [
    authMiddleware,
    upload.single('audio'),
    body('scriptId').isMongoId(),
    body('duration').isFloat({ min: 0 })
], async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Debug: Log the entire request
        console.log('=== PRACTICE SUBMISSION DEBUG ===');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        console.log('Files:', req.files);
        console.log('File:', req.file);
        console.log('Content-Type:', req.headers['content-type']);
        console.log('================================');

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error('Validation errors:', errors.array());
            res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
            return;
        }

        const { scriptId, duration } = req.body;
        const userId = (req as any).user._id;
        const audioFile = req.file;

        console.log('Practice submission received:', {
            scriptId,
            duration,
            userId,
            hasAudioFile: !!audioFile,
            audioFileSize: audioFile?.size,
            audioFileName: audioFile?.originalname,
            audioFileMimeType: audioFile?.mimetype
        });

        if (!audioFile) {
            console.error('No audio file received. Request details:', {
                contentType: req.headers['content-type'],
                bodyKeys: Object.keys(req.body),
                hasFiles: !!req.files,
                hasFile: !!req.file
            });
            res.status(400).json({ message: 'Audio file is required.' });
            return;
        }

        // Verify script exists
        const script = await Script.findById(scriptId);
        if (!script) {
            res.status(404).json({ message: 'Script not found.' });
            return;
        }

        try {
            console.log('Starting transcription for script:', script.title);

            // Transcribe audio using Whisper API
            const transcriptionResult = await AIService.transcribeAudio(audioFile.buffer, script.language);

            console.log('Transcription completed:', transcriptionResult.transcript);

            // Generate AI feedback
            const feedbackResult = await AIService.generateFeedback(
                script.textContent,
                transcriptionResult.transcript,
                duration
            );

            console.log('Feedback generated:', {
                score: feedbackResult.score,
                accuracy: feedbackResult.accuracy,
                fluency: feedbackResult.fluency
            });

            // Create practice session with results
            const session = new PracticeSession({
                userId,
                scriptId,
                score: feedbackResult.score,
                accuracy: feedbackResult.accuracy,
                fluency: feedbackResult.fluency,
                duration: duration,
                wordsPerMinute: feedbackResult.wordsPerMinute,
                feedback: feedbackResult.feedbackComments.join(' '),
                audioUrl: '', // You can store audio URL if needed
                transcript: transcriptionResult.transcript // Store the transcript
            });

            await session.save();
            console.log('Practice session saved successfully');

            res.json({
                message: 'Practice session completed successfully.',
                session: {
                    id: session._id,
                    score: session.score,
                    accuracy: session.accuracy,
                    fluency: session.fluency,
                    duration: session.duration,
                    wordsPerMinute: session.wordsPerMinute,
                    feedback: session.feedback,
                    transcript: session.transcript,
                    originalScript: script.textContent
                }
            });
        } catch (transcriptionError) {
            console.error('Transcription error:', transcriptionError);
            res.status(500).json({
                message: 'Failed to process audio. Please try again.',
                error: transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'
            });
        }
    } catch (error) {
        console.error('Practice submission error:', error);
        next(error);
    }
});

// Submit practice results (legacy endpoint for backward compatibility)
router.put('/:sessionId/submit', [
    authMiddleware,
    body('score').isFloat({ min: 0, max: 100 }),
    body('accuracy').isFloat({ min: 0, max: 100 }),
    body('fluency').isFloat({ min: 0, max: 100 }),
    body('duration').isFloat({ min: 0 }),
    body('wordsPerMinute').optional().isFloat({ min: 0 }),
    body('audioUrl').optional().isURL(),
    body('feedback').optional().isString()
], async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { sessionId } = req.params;
        const userId = (req as any).user._id;
        const {
            score,
            accuracy,
            fluency,
            duration,
            wordsPerMinute,
            audioUrl,
            feedback
        } = req.body;

        // Find and update session
        const session = await PracticeSession.findOneAndUpdate(
            { _id: sessionId, userId },
            {
                score,
                accuracy,
                fluency,
                duration,
                wordsPerMinute,
                audioUrl,
                feedback
            },
            { new: true }
        );

        if (!session) {
            res.status(404).json({ message: 'Practice session not found.' });
            return;
        }

        res.json({
            message: 'Practice session completed.',
            session
        });
    } catch (error) {
        next(error);
    }
});

// Get practice session
router.get('/session/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user._id;

        const session = await PracticeSession.findOne({ _id: id, userId })
            .populate('scriptId');

        if (!session) {
            res.status(404).json({ message: 'Practice session not found.' });
            return;
        }

        res.json({ session });
    } catch (error) {
        next(error);
    }
});

// Get practice statistics
router.get('/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user._id;

        const sessions = await PracticeSession.find({ userId });
        const totalSessions = sessions.length;

        if (totalSessions === 0) {
            res.json({
                totalSessions: 0,
                avgScore: 0,
                avgAccuracy: 0,
                avgFluency: 0,
                totalDuration: 0,
                avgWordsPerMinute: 0
            });
            return;
        }

        const avgScore = sessions.reduce((sum: number, session: any) => sum + session.score, 0) / totalSessions;
        const avgAccuracy = sessions.reduce((sum: number, session: any) => sum + session.accuracy, 0) / totalSessions;
        const avgFluency = sessions.reduce((sum: number, session: any) => sum + session.fluency, 0) / totalSessions;
        const totalDuration = sessions.reduce((sum: number, session: any) => sum + session.duration, 0);
        const avgWordsPerMinute = sessions.reduce((sum: number, session: any) => sum + (session.wordsPerMinute || 0), 0) / totalSessions;

        res.json({
            totalSessions,
            avgScore,
            avgAccuracy,
            avgFluency,
            totalDuration,
            avgWordsPerMinute
        });
    } catch (error) {
        next(error);
    }
});

export default router; 