import express, { Request, Response, NextFunction, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { PracticeSession } from '../models/PracticeSession';
import { Script } from '../models/Script';

const router: Router = express.Router();

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

// Submit practice results
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