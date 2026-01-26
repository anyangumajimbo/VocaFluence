import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import Comment from '../models/Comment';
import logger from '../utils/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router: Router = Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/reference-audio');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for audio uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    }),
    fileFilter: (req, file, cb) => {
        // Accept only audio files
        const allowedMimes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/ogg'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only audio files are allowed.'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware to check if user is admin
const isAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = (req as any).user;
        if (!user || user.role !== 'admin') {
            res.status(403).json({ error: 'Admin access required' });
            return;
        }
        next();
    } catch (err) {
        res.status(500).json({ error: 'Authorization failed' });
    }
};

// GET: All students with their activity counts
router.get('/review/students', authMiddleware, isAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const students = await User.find({ role: 'student' }).select('name email');
        
        // Get activity counts for each student
        const studentsWithCounts = await Promise.all(
            students.map(async (student: any) => {
                const activityCount = await ActivityLog.countDocuments({ userId: student._id });
                const pendingComments = await Comment.countDocuments({
                    studentId: student._id,
                    status: 'pending'
                });
                return {
                    _id: student._id,
                    name: student.name,
                    email: student.email,
                    activityCount,
                    pendingComments,
                };
            })
        );

        res.json(studentsWithCounts);
    } catch (err) {
        logger.error('Error fetching students:', err);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// GET: Activities for a specific student
router.get('/review/students/:studentId/activities', authMiddleware, isAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;
        const { limit = 10, skip = 0 } = req.query;

        const activities = await ActivityLog.find({ userId: studentId })
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip));

        // Get comment count for each activity
        const activitiesWithComments = await Promise.all(
            activities.map(async (activity) => {
                const commentCount = await Comment.countDocuments({ activityId: activity._id });
                const lastComment = await Comment.findOne({ activityId: activity._id })
                    .sort({ createdAt: -1 })
                    .populate('adminId', 'name');
                
                return {
                    ...activity.toObject(),
                    commentCount,
                    lastComment: lastComment ? {
                        text: lastComment.text,
                        adminName: (lastComment.adminId as any).name,
                        createdAt: lastComment.createdAt,
                    } : null,
                };
            })
        );

        const total = await ActivityLog.countDocuments({ userId: studentId });

        res.json({
            activities: activitiesWithComments,
            total,
        });
    } catch (err) {
        logger.error('Error fetching student activities:', err);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});

// POST: Add a comment to an activity with optional reference audio
router.post('/review/comments', authMiddleware, isAdmin, upload.single('referenceAudio'), async (req: Request, res: Response): Promise<void> => {
    try {
        const { activityId, studentId, text } = req.body;
        const user = (req as any).user;
        const adminId = user._id;

        if (!activityId || !studentId || !text) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const comment = new Comment({
            activityId,
            studentId,
            adminId,
            text,
            referenceAudio: req.file ? req.file.filename : null,
            status: 'pending',
        });

        await comment.save();
        await comment.populate('adminId', 'name');

        logger.info(`Admin ${adminId} added comment to activity ${activityId}`);
        res.status(201).json(comment);
    } catch (err) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        logger.error('Error creating comment:', err);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// GET: All comments for an activity
router.get('/review/comments/:activityId', authMiddleware, isAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { activityId } = req.params;

        const comments = await Comment.find({ activityId })
            .sort({ createdAt: -1 })
            .populate('adminId', 'name');

        res.json(comments);
    } catch (err) {
        logger.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// PUT: Update comment status
router.put('/review/comments/:commentId', authMiddleware, isAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { commentId } = req.params;
        const { status, text } = req.body;
        const user = (req as any).user;

        const comment = await Comment.findByIdAndUpdate(
            commentId,
            { ...(status && { status }), ...(text && { text }) },
            { new: true }
        ).populate('adminId', 'name');

        if (!comment) {
            res.status(404).json({ error: 'Comment not found' });
            return;
        }

        logger.info(`Admin ${user._id} updated comment ${commentId}`);
        res.json(comment);
    } catch (err) {
        logger.error('Error updating comment:', err);
        res.status(500).json({ error: 'Failed to update comment' });
    }
});

// DELETE: Delete a comment
router.delete('/review/comments/:commentId', authMiddleware, isAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { commentId } = req.params;
        const user = (req as any).user;

        const comment = await Comment.findByIdAndDelete(commentId);

        if (!comment) {
            res.status(404).json({ error: 'Comment not found' });
            return;
        }

        logger.info(`Admin ${user._id} deleted comment ${commentId}`);
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        logger.error('Error deleting comment:', err);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

// GET: Download reference audio for a comment (admin)
router.get('/review/comments/:commentId/reference-audio', authMiddleware, isAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { commentId } = req.params;
        
        const comment = await Comment.findById(commentId);
        if (!comment || !comment.referenceAudio) {
            res.status(404).json({ error: 'Reference audio not found' });
            return;
        }

        const filePath = path.join(uploadDir, comment.referenceAudio);
        
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ error: 'Audio file not found' });
            return;
        }

        res.download(filePath);
    } catch (err) {
        logger.error('Error downloading reference audio:', err);
        res.status(500).json({ error: 'Failed to download audio' });
    }
});

// GET: Download reference audio for a comment (student owns comment)
router.get('/student/comments/:commentId/reference-audio', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { commentId } = req.params;
        const user = (req as any).user;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            res.status(404).json({ error: 'Reference audio not found' });
            return;
        }

        if (String(comment.studentId) !== String(user._id)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        if (!comment.referenceAudio) {
            res.status(404).json({ error: 'Reference audio not found' });
            return;
        }

        const filePath = path.join(uploadDir, comment.referenceAudio);

        if (!fs.existsSync(filePath)) {
            res.status(404).json({ error: 'Audio file not found' });
            return;
        }

        res.download(filePath);
    } catch (err) {
        logger.error('Error downloading reference audio (student):', err);
        res.status(500).json({ error: 'Failed to download audio' });
    }
});

// GET: All feedback for a student
router.get('/admin/student/feedback', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        const studentId = user._id;

        const comments = await Comment.find({ studentId })
            .populate('adminId', 'name')
            .populate('activityId', 'title textContent createdAt')
            .sort({ createdAt: -1 });

        res.json(comments);
    } catch (err) {
        logger.error('Error fetching student feedback:', err);
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
});

// GET: Review queue - all pending comments
router.get('/review/queue', authMiddleware, isAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const pendingComments = await Comment.find({ status: 'pending' })
            .populate('studentId', 'name')
            .populate('activityId', 'title')
            .sort({ createdAt: -1 });

        res.json(pendingComments);
    } catch (err) {
        logger.error('Error fetching review queue:', err);
        res.status(500).json({ error: 'Failed to fetch review queue' });
    }
});

export default router;
