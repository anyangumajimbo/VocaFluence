import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

interface AuthRequest extends Request {
    user?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            res.status(401).json({ message: 'Access denied. No token provided.' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.userId);

        if (!user) {
            res.status(401).json({ message: 'Invalid token.' });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
        return;
    }
};

export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Access denied. No user found.' });
            return;
        }

        if (req.user.role !== 'admin') {
            res.status(403).json({ message: 'Access denied. Admin privileges required.' });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
        return;
    }
};

export const studentMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Access denied. No user found.' });
            return;
        }

        if (req.user.role !== 'student') {
            res.status(403).json({ message: 'Access denied. Student privileges required.' });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
        return;
    }
}; 