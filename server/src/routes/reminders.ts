import express, { Request, Response, NextFunction, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { User } from '../models/User';

const router: Router = express.Router();

// Get reminder settings
router.get('/settings', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = (req as any).user;
        res.json({
            reminderSettings: user.reminderSettings || {
                enabled: false,
                frequency: 'daily',
                time: '09:00',
                timezone: 'UTC'
            }
        });
    } catch (error) {
        next(error);
    }
});

// Update reminder settings
router.put('/settings', [
    authMiddleware,
    body('enabled').isBoolean(),
    body('frequency').isIn(['daily', 'weekly']),
    body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('timezone').isString()
], async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { enabled, frequency, time, timezone } = req.body;
        const userId = (req as any).user._id;

        const user = await User.findByIdAndUpdate(
            userId,
            {
                reminderSettings: {
                    enabled,
                    frequency,
                    time,
                    timezone
                }
            },
            { new: true }
        );

        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }

        res.json({
            message: 'Reminder settings updated.',
            reminderSettings: user.reminderSettings
        });
    } catch (error) {
        next(error);
    }
});

// Get reminder status
router.get('/status', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = (req as any).user;
        const settings = user.reminderSettings || {};

        res.json({
            enabled: settings.enabled || false,
            lastReminder: user.lastReminder || null,
            nextReminder: user.nextReminder || null
        });
    } catch (error) {
        next(error);
    }
});

// Toggle reminder status
router.post('/toggle', [
    authMiddleware,
    body('enabled').isBoolean()
], async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { enabled } = req.body;
        const userId = (req as any).user._id;

        const user = await User.findByIdAndUpdate(
            userId,
            {
                'reminderSettings.enabled': enabled
            },
            { new: true }
        );

        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }

        res.json({
            message: `Reminders ${enabled ? 'enabled' : 'disabled'}.`,
            enabled: user.reminderSettings?.enabled || false
        });
    } catch (error) {
        next(error);
    }
});

// Get reminder statistics
router.get('/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = (req as any).user;

        res.json({
            totalReminders: user.totalReminders || 0,
            streakDays: user.streakDays || 0,
            lastPracticeDate: user.lastPracticeDate || null
        });
    } catch (error) {
        next(error);
    }
});

// Get practice streak
router.get('/streak', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = (req as any).user;

        res.json({
            currentStreak: user.streakDays || 0,
            longestStreak: user.longestStreak || 0,
            lastPracticeDate: user.lastPracticeDate || null
        });
    } catch (error) {
        next(error);
    }
});

// Trigger manual reminder
router.post('/trigger', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = (req as any).user;

        // TODO: Implement actual reminder logic
        // For now, just update the last reminder timestamp
        await User.findByIdAndUpdate(user._id, {
            lastReminder: new Date()
        });

        res.json({
            message: 'Reminder triggered successfully.',
            timestamp: new Date()
        });
    } catch (error) {
        next(error);
    }
});

export default router; 