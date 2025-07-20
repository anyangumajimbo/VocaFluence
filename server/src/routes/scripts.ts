import express, { Request, Response, NextFunction, Router } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { Script } from '../models/Script';

const router: Router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'));
        }
    }
});

// Get all scripts
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { language, difficulty, category } = req.query;
        const filter: any = {};

        if (language) filter.language = language;
        if (difficulty) filter.difficulty = difficulty;
        if (category) filter.category = category;

        const scripts = await Script.find(filter).sort({ createdAt: -1 });

        res.json({ scripts });
    } catch (error) {
        next(error);
    }
});

// Get script by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const script = await Script.findById(id);

        if (!script) {
            res.status(404).json({ message: 'Script not found.' });
            return;
        }

        res.json({ script });
    } catch (error) {
        next(error);
    }
});

// Create new script (admin only)
router.post('/', [
    authMiddleware,
    adminMiddleware,
    body('title').trim().notEmpty(),
    body('textContent').trim().notEmpty(),
    body('language').isIn(['english', 'french', 'swahili']),
    body('difficulty').isIn(['beginner', 'intermediate', 'advanced']),
    body('tags').optional().isArray()
], async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const {
            title,
            textContent,
            language,
            difficulty,
            tags
        } = req.body;

        const script = new Script({
            title,
            textContent,
            language,
            difficulty,
            tags: tags || [],
            uploadedBy: (req as any).user._id
        });

        await script.save();

        res.status(201).json({
            message: 'Script created successfully.',
            script
        });
    } catch (error) {
        next(error);
    }
});

// Update script (admin only)
router.put('/:id', [
    authMiddleware,
    adminMiddleware,
    body('title').optional().trim().notEmpty(),
    body('content').optional().trim().notEmpty(),
    body('language').optional().isIn(['english', 'french', 'swahili']),
    body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    body('category').optional().trim().notEmpty(),
    body('description').optional().isString(),
    body('tags').optional().isArray()
], async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { id } = req.params;
        const updateData = req.body;

        const script = await Script.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!script) {
            res.status(404).json({ message: 'Script not found.' });
            return;
        }

        res.json({
            message: 'Script updated successfully.',
            script
        });
    } catch (error) {
        next(error);
    }
});

// Delete script (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        const script = await Script.findByIdAndDelete(id);

        if (!script) {
            res.status(404).json({ message: 'Script not found.' });
            return;
        }

        res.json({ message: 'Script deleted successfully.' });
    } catch (error) {
        next(error);
    }
});

// Upload audio for script (admin only)
router.post('/:id/audio', authMiddleware, adminMiddleware, upload.single('audio'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const audioFile = req.file;

        if (!audioFile) {
            res.status(400).json({ message: 'No audio file provided.' });
            return;
        }

        const script = await Script.findByIdAndUpdate(
            id,
            {
                audioUrl: `/uploads/${audioFile.filename}`
            },
            { new: true }
        );

        if (!script) {
            res.status(404).json({ message: 'Script not found.' });
            return;
        }

        res.json({
            message: 'Audio uploaded successfully.',
            script
        });
    } catch (error) {
        next(error);
    }
});

export default router; 