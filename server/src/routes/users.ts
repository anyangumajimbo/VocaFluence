import express, { Request, Response, NextFunction, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { User } from '../models/User';
import { PracticeSession } from '../models/PracticeSession';

const router: Router = express.Router();

// Get all users (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { page = 1, limit = 10, role, status } = req.query;
        const filter: any = {};

        if (role) filter.role = role;
        if (status) filter.status = status;

        const skip = (Number(page) - 1) * Number(limit);

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            User.countDocuments(filter)
        ]);

        res.json({
            users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get user by ID (admin only)
router.get('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');

        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }

        res.json({ user });
    } catch (error) {
        next(error);
    }
});

// Update user status (admin only)
router.put('/:id/status', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive', 'suspended'].includes(status)) {
            res.status(400).json({ message: 'Invalid status.' });
            return;
        }

        const user = await User.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).select('-password');

        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }

        res.json({
            message: 'User status updated successfully.',
            user
        });
    } catch (error) {
        next(error);
    }
});

// Update user profile
router.put('/profile', [
    authMiddleware,
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('preferredLanguages').optional().isArray({ min: 1, max: 3 }).withMessage('Select 1-3 preferred languages'),
    body('preferredLanguages.*').optional().isIn(['english', 'french', 'swahili']).withMessage('Invalid language'),
    body('schedule.frequency').optional().isIn(['daily', 'weekly', 'custom']),
    body('schedule.reminderTime').optional().isString(),
    body('timezone').optional().isString()
], async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const userId = (req as any).user._id;
        const updateData = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }

        res.json({
            message: 'Profile updated successfully.',
            user
        });
    } catch (error) {
        next(error);
    }
});

// Get user statistics
router.get('/stats/overview', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user._id;

        // Get practice sessions
        const sessions = await PracticeSession.find({ userId });

        // Calculate statistics
        const totalSessions = sessions.length;
        const totalPracticeTime = sessions.reduce((sum: number, session: any) => sum + session.duration, 0);
        const avgScore = totalSessions > 0 ? sessions.reduce((sum: number, session: any) => sum + session.score, 0) / totalSessions : 0;
        const avgAccuracy = totalSessions > 0 ? sessions.reduce((sum: number, session: any) => sum + session.accuracy, 0) / totalSessions : 0;
        const avgFluency = totalSessions > 0 ? sessions.reduce((sum: number, session: any) => sum + session.fluency, 0) / totalSessions : 0;

        // Calculate practice streak
        const practiceDates = sessions.map((session: any) => {
            const date = new Date(session.createdAt);
            return date.setHours(0, 0, 0, 0);
        });

        const uniqueDates = [...new Set(practiceDates)].sort((a: number, b: number) => b - a);

        let currentStreak = 0;
        for (let i = 0; i < uniqueDates.length; i++) {
            if (i === 0 || uniqueDates[i - 1] - uniqueDates[i] === 86400000) {
                currentStreak++;
            } else {
                break;
            }
        }

        res.json({
            totalSessions,
            totalPracticeTime,
            avgScore,
            avgAccuracy,
            avgFluency,
            currentStreak,
            lastPracticeDate: uniqueDates.length > 0 ? new Date(uniqueDates[0]) : null
        });
    } catch (error) {
        next(error);
    }
});

// Get user progress by language
router.get('/stats/languages', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user._id;

        // Get practice sessions with script details
        const sessions = await PracticeSession.find({ userId })
            .populate('scriptId', 'language');

        // Group by language
        const languageStats: any = {};
        sessions.forEach((session: any) => {
            const language = session.scriptId?.language;
            if (language) {
                if (!languageStats[language]) {
                    languageStats[language] = {
                        sessions: 0,
                        totalTime: 0,
                        avgScore: 0,
                        avgAccuracy: 0,
                        avgFluency: 0
                    };
                }
                languageStats[language].sessions++;
                languageStats[language].totalTime += session.duration;
                languageStats[language].avgScore += session.score;
                languageStats[language].avgAccuracy += session.accuracy;
                languageStats[language].avgFluency += session.fluency;
            }
        });

        // Calculate averages
        Object.keys(languageStats).forEach(language => {
            const stats = languageStats[language];
            if (stats.sessions > 0) {
                stats.avgScore = stats.avgScore / stats.sessions;
                stats.avgAccuracy = stats.avgAccuracy / stats.sessions;
                stats.avgFluency = stats.avgFluency / stats.sessions;
            }
        });

        res.json({ languageStats });
    } catch (error) {
        next(error);
    }
});

// Get user achievements
router.get('/achievements', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user._id;

        // Get practice sessions
        const sessions = await PracticeSession.find({ userId });

        // Calculate achievements
        const achievements = {
            firstSession: sessions.length > 0,
            tenSessions: sessions.length >= 10,
            fiftySessions: sessions.length >= 50,
            hundredSessions: sessions.length >= 100,
            perfectScore: sessions.some((session: any) => session.score === 100),
            streakWeek: false, // TODO: Implement streak calculation
            streakMonth: false, // TODO: Implement streak calculation
            allLanguages: false // TODO: Check if practiced all languages
        };

        res.json({ achievements });
    } catch (error) {
        next(error);
    }
});

// Get user practice streak
router.get('/streak', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            streak: {
                currentStreak: user.streakDays || 0,
                longestStreak: user.longestStreak || 0,
                lastPracticeDate: user.lastPracticeDate || null
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router; 