import express, { Request, Response, NextFunction, Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { ActivityLog, type ActivityType } from '../models/ActivityLog';
import mongoose from 'mongoose';

const router: Router = express.Router();

/**
 * GET /api/activity/history
 * Get user's activity history with optional filtering by type
 * Query params:
 * - type: 'practice' | 'oral_exam' | 'vocabulary' | 'listening' (optional)
 * - limit: number (default: 20)
 * - skip: number (default: 0)
 */
router.get('/history', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const { type, limit = 20, skip = 0 } = req.query;

        const query: any = { userId };
        if (type && ['practice', 'oral_exam', 'vocabulary', 'listening'].includes(type as string)) {
            query.activityType = type as ActivityType;
        }

        const activities = await ActivityLog.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip));

        const total = await ActivityLog.countDocuments(query);

        res.json({
            activities,
            pagination: {
                total,
                limit: Number(limit),
                skip: Number(skip),
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/activity/history/:id
 * Get a single activity with audio data
 */
router.get('/history/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const { id } = req.params;

        // Validate MongoDB ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid activity ID' });
            return;
        }

        const activity = await ActivityLog.findOne({ _id: id, userId });

        if (!activity) {
            res.status(404).json({ message: 'Activity not found' });
            return;
        }

        res.json({ activity });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/activity/history/:id/audio
 * Get audio file for an activity
 */
router.get('/history/:id/audio', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const { id } = req.params;

        // Validate MongoDB ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid activity ID' });
            return;
        }

        const activity = await ActivityLog.findOne({ _id: id, userId });

        if (!activity) {
            res.status(404).json({ message: 'Activity not found' });
            return;
        }

        if (!activity.audioBuffer) {
            res.status(404).json({ message: 'No audio recording found for this activity' });
            return;
        }

        // Send audio with proper headers
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="activity-${id}.mp3"`);
        res.send(activity.audioBuffer);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/activity/categories
 * Get available activity categories and counts
 */
router.get('/categories', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user._id;

        const categories = await ActivityLog.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId as string) } },
            {
                $group: {
                    _id: '$activityType',
                    count: { $sum: 1 },
                    lastActivity: { $max: '$createdAt' }
                }
            },
            { $sort: { lastActivity: -1 } }
        ]);

        const categoryMap: Record<string, { count: number; lastActivity: Date }> = {
            practice: { count: 0, lastActivity: new Date(0) },
            oral_exam: { count: 0, lastActivity: new Date(0) },
            vocabulary: { count: 0, lastActivity: new Date(0) },
            listening: { count: 0, lastActivity: new Date(0) }
        };

        categories.forEach((cat: any) => {
            categoryMap[cat._id] = { count: cat.count, lastActivity: cat.lastActivity };
        });

        res.json({ categories: categoryMap });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/activity/stats
 * Get activity statistics
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user._id;

        const stats = await ActivityLog.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId as string) } },
            {
                $group: {
                    _id: null,
                    totalActivities: { $sum: 1 },
                    totalDuration: { $sum: '$duration' },
                    avgScore: { $avg: '$score' },
                    avgAccuracy: { $avg: '$accuracy' },
                    avgFluency: { $avg: '$fluency' }
                }
            }
        ]);

        const data = stats[0] || {
            totalActivities: 0,
            totalDuration: 0,
            avgScore: 0,
            avgAccuracy: 0,
            avgFluency: 0
        };

        res.json({ stats: data });
    } catch (error) {
        next(error);
    }
});

export default router;
