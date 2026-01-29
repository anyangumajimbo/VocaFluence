import express, { Request, Response, NextFunction, Router } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { Script } from '../models/Script';

const router: Router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/reference-audio');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Different folders for different types of audio
        if (file.fieldname === 'referenceAudio') {
            cb(null, 'uploads/reference-audio/');
        } else {
            cb(null, 'uploads/');
        }
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
        const { language, languages, difficulty, category, page = 1, limit = 12, fromDate } = req.query;
        const filter: any = {};

        // Support both single language and multiple languages (comma-separated)
        if (languages) {
            // Multiple languages as comma-separated string
            const langArray = (languages as string).split(',').map(l => l.trim().toLowerCase());
            filter.language = { $in: langArray };
        } else if (language) {
            // Single language for backward compatibility
            const selectedLanguage = (language as string)?.toLowerCase();
            if (['english', 'french', 'swahili'].includes(selectedLanguage)) {
                filter.language = selectedLanguage;
            }
        }
        
        if (difficulty) filter.difficulty = difficulty;
        if (category) filter.category = category;
        
        // Filter by creation date if provided
        if (fromDate) {
            filter.createdAt = { $gte: new Date(fromDate as string) };
        }

        // Calculate pagination
        const pageNum = Math.max(1, parseInt(page as string) || 1);
        const limitNum = Math.max(1, parseInt(limit as string) || 12);
        const skip = (pageNum - 1) * limitNum;

        // Get total count for pagination
        const total = await Script.countDocuments(filter);
        const pages = Math.ceil(total / limitNum);

        // Get paginated scripts, sorted by difficulty and creation date
        const scripts = await Script.find(filter)
            .sort({ 
                difficulty: 1,  // Sort by difficulty: beginner, intermediate, advanced
                createdAt: -1   // Then by creation date (newest first)
            })
            .skip(skip)
            .limit(limitNum);

        res.json({ 
            scripts,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages
            }
        });
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

// Create new script (all authenticated users)
router.post('/', [
    authMiddleware,
    upload.single('referenceAudio'), // Handle file upload
    body('title').trim().notEmpty(),
    body('textContent').trim().notEmpty(),
    body('language').isIn(['english', 'french', 'swahili']),
    body('difficulty').isIn(['beginner', 'intermediate', 'advanced']),
    body('tags').optional()
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

        // Parse tags if it's a JSON string
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch (e) {
                parsedTags = typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : [];
            }
        }

        const scriptData: any = {
            title,
            textContent,
            language,
            difficulty,
            tags: parsedTags,
            uploadedBy: (req as any).user._id
        };

        // Add reference audio URL if file was uploaded
        if (req.file) {
            // Store relative path for the URL
            scriptData.referenceAudioURL = `/uploads/reference-audio/${req.file.filename}`;
        }

        const script = new Script(scriptData);
        await script.save();

        res.status(201).json({
            message: 'Script created successfully.',
            script
        });
    } catch (error) {
        next(error);
    }
});

// Update script (all authenticated users)
router.put('/:id', [
    authMiddleware,
    upload.single('referenceAudio'), // Handle file upload
    body('title').optional().trim().notEmpty(),
    body('textContent').optional().trim().notEmpty(),
    body('content').optional().trim().notEmpty(),
    body('language').optional().isIn(['english', 'french', 'swahili']),
    body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    body('category').optional().trim().notEmpty(),
    body('description').optional().isString(),
    body('tags').optional()
], async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { id } = req.params;
        const updateData: any = { ...req.body };

        // Parse tags if it's a JSON string
        if (updateData.tags) {
            try {
                updateData.tags = typeof updateData.tags === 'string' ? JSON.parse(updateData.tags) : updateData.tags;
            } catch (e) {
                updateData.tags = typeof updateData.tags === 'string' ? updateData.tags.split(',').map((t: string) => t.trim()) : updateData.tags;
            }
        }

        // Add reference audio URL if file was uploaded
        if (req.file) {
            updateData.referenceAudioURL = `/uploads/reference-audio/${req.file.filename}`;
        }

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

// Delete script (all authenticated users)
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

// Upload audio for script (all authenticated users)
router.post('/:id/audio', authMiddleware, upload.single('audio'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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