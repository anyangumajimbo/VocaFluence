import express, { Request, Response, NextFunction, Router } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { Script } from '../models/Script';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

const router: Router = express.Router();

// Configure multer to use memory storage (for Cloudinary upload)
const storage = multer.memoryStorage();

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

        // Always filter to show only scripts from 2026-01-29 onwards (hide all old scripts)
        const defaultFilterDate = new Date('2026-01-29T00:00:00.000Z');
        filter.createdAt = { $gte: defaultFilterDate };

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

        // Upload audio to Cloudinary if file was uploaded
        if (req.file) {
            try {
                // Convert buffer to stream for Cloudinary
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'video', // Cloudinary uses 'video' for audio files
                        folder: 'vocafluence/reference-audio',
                        public_id: `ref-audio-${Date.now()}`,
                        format: path.extname(req.file.originalname).substring(1) || 'mp3'
                    },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary upload error:', error);
                        }
                    }
                );

                // Pipe the buffer to Cloudinary
                const bufferStream = Readable.from(req.file.buffer);
                const uploadPromise = new Promise<any>((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            resource_type: 'video',
                            folder: 'vocafluence/reference-audio',
                            public_id: `ref-audio-${Date.now()}`,
                            format: path.extname(req.file?.originalname || '').substring(1) || 'mp3'
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    bufferStream.pipe(stream);
                });

                const uploadResult = await uploadPromise;
                scriptData.referenceAudioURL = uploadResult.secure_url;
                console.log('Audio uploaded to Cloudinary:', uploadResult.secure_url);
            } catch (uploadError) {
                console.error('Failed to upload to Cloudinary:', uploadError);
                // Continue without audio if upload fails
            }
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

        // Upload audio to Cloudinary if file was uploaded
        if (req.file) {
            try {
                const bufferStream = Readable.from(req.file.buffer);
                const uploadPromise = new Promise<any>((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            resource_type: 'video',
                            folder: 'vocafluence/reference-audio',
                            public_id: `ref-audio-${Date.now()}`,
                            format: path.extname(req.file?.originalname || '').substring(1) || 'mp3'
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    bufferStream.pipe(stream);
                });

                const uploadResult = await uploadPromise;
                updateData.referenceAudioURL = uploadResult.secure_url;
                console.log('Audio uploaded to Cloudinary:', uploadResult.secure_url);
            } catch (uploadError) {
                console.error('Failed to upload to Cloudinary:', uploadError);
            }
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