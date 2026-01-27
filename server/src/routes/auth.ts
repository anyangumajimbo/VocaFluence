import express, { Request, Response, NextFunction, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User';
import { authMiddleware } from '../middleware/auth';
import logger from '../utils/logger';
import EmailService from '../services/emailService';

const router: Router = express.Router();

// Register
router.post('/register', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('role').isIn(['student', 'admin']).withMessage('Role must be student or admin'),
    body('preferredLanguage').isIn(['english', 'french', 'swahili']).withMessage('Preferred language is required')
], async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { email, password, firstName, lastName, role, preferredLanguage } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists.' });
            return;
        }

        // Create user with plain password (let pre-save hook hash it)
        const user = new User({
            email: email.toLowerCase(),
            password, // Pre-save hook will hash this
            firstName,
            lastName,
            role,
            preferredLanguage
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully.',
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
});

// Login - Fixed to ensure all code paths return a value
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req: Request, res: Response, next: NextFunction) => {
    // Production logging for login attempts
    logger.info('NEW LOGIN ATTEMPT: %O', {
        body: req.body,
        headers: req.headers['content-type']
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('Validation errors: %O', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        logger.warn('User not found for email: %s', email);
        return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Log password check (do not log actual password in production)
    logger.info('Checking password for user: %s', email);

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        logger.warn('Password mismatch for user: %s', email);
        return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
    );

    return res.json({
        message: 'Login successful.',
        token,
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        }
    });
});

// Get current user
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        res.json({
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
});

// Change password
router.put('/change-password', [
    authMiddleware,
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
], async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { currentPassword, newPassword } = req.body;
        const user = (req as any).user;

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            res.status(400).json({ message: 'Current password is incorrect.' });
            return;
        }

        // Update password (pre-save hook will hash it)
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully.' });
    } catch (error) {
        next(error);
    }
});

// Forgot password
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail()
], async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { email } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            // For security, don't reveal that the user doesn't exist
            // Still return success to prevent email enumeration
            res.json({ message: 'If an account exists with this email, password reset instructions have been sent.' });
            return;
        }

        // Generate reset token (1 hour expiration)
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET!,
            { expiresIn: '1h' }
        );

        // Send password reset email
        const emailSent = await EmailService.sendPasswordResetEmail(
            user.email,
            resetToken,
            user.firstName
        );

        if (!emailSent) {
            logger.error('Failed to send password reset email to:', user.email);
            // Still return success to user for security
        }

        // Never return the token to clients
        res.json({
            message: 'If an account exists with this email, password reset instructions have been sent.'
        });
    } catch (error) {
        next(error);
    }
});

// Reset password
router.post('/reset-password', [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { token, newPassword } = req.body;

        // Verify token
        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET!);
        } catch (err) {
            res.status(400).json({ message: 'Invalid or expired reset token.' });
            return;
        }

        // Find user
        const user = await User.findById(decoded.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }

        // Update password (pre-save hook will hash it)
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password reset successfully.' });
    } catch (error) {
        next(error);
    }
});

export default router;