import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import morgan from 'morgan';
import logger from './utils/logger';

// Import routes
import authRoutes from './routes/auth';
import scriptRoutes from './routes/scripts';
import practiceRoutes from './routes/practice';
import userRoutes from './routes/users';
import reminderRoutes from './routes/reminders';
import oralExamRoutes from './routes/oralExam';
import activityRoutes from './routes/activity';
import reviewRoutes from './routes/review';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Import services
import { initializeReminderService } from './services/reminderService';
import AIService from './services/aiService';
import EmailService from './services/emailService';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting (needed for deployment platforms like Render)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration - accept localhost, Vercel main domain, and all Vercel preview URLs
const corsOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.0.102:5173',
    'https://voca-fluence-client.vercel.app',
    'https://vocafluence-client.vercel.app',
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);

        // Allow localhost / LAN during dev on any port
        const devOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\\d+)?$/;

        const ngrokPattern = /\.ngrok-free\.app$/;

        if (
            corsOrigins.includes(origin) ||
            devOriginPattern.test(origin) ||
            origin.includes('vercel.app') ||
            ngrokPattern.test(origin)
        ) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add CORS headers for static files (uploads) - MUST be before express.static
app.use((req, res, next) => {
    if (req.path.startsWith('/uploads')) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header('Cross-Origin-Resource-Sharing', 'true');
        
        // Set proper MIME types for audio files with diagnostics
        if (req.path.includes('reference-audio')) {
            logger.info(`[AUDIO] Serving audio file: ${req.path}`);
            
            if (req.path.endsWith('.webm')) {
                res.type('audio/webm');
                logger.info(`[AUDIO] Set MIME type to audio/webm for: ${req.path}`);
            } else if (req.path.endsWith('.mp3')) {
                res.type('audio/mpeg');
                logger.info(`[AUDIO] Set MIME type to audio/mpeg for: ${req.path}`);
            } else if (req.path.endsWith('.wav')) {
                res.type('audio/wav');
                logger.info(`[AUDIO] Set MIME type to audio/wav for: ${req.path}`);
            } else if (req.path.endsWith('.m4a')) {
                res.type('audio/mp4');
                logger.info(`[AUDIO] Set MIME type to audio/mp4 for: ${req.path}`);
            } else {
                logger.warn(`[AUDIO] Unknown audio file extension: ${req.path}`);
            }
        }
    }
    next();
});

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    maxAge: '1d',
    etag: false,
    setHeaders: (res, filePath) => {
        // Double-check MIME type for audio files
        if (filePath.includes('reference-audio')) {
            if (filePath.endsWith('.webm')) {
                res.setHeader('Content-Type', 'audio/webm');
            } else if (filePath.endsWith('.mp3')) {
                res.setHeader('Content-Type', 'audio/mpeg');
            } else if (filePath.endsWith('.wav')) {
                res.setHeader('Content-Type', 'audio/wav');
            } else if (filePath.endsWith('.m4a')) {
                res.setHeader('Content-Type', 'audio/mp4');
            }
        }
        // Always set CORS headers for uploads
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
}));

// Use morgan for HTTP request logging
app.use(morgan('combined', {
    stream: {
        write: (message: string) => logger.info(message.trim()),
    },
}));

// Add route logging to debug
app.use((req, res, next) => {
    console.log(`Incoming ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/practice', authMiddleware, practiceRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/reminders', authMiddleware, reminderRoutes);
app.use('/api/oral-exam', oralExamRoutes);
app.use('/api/activity', authMiddleware, activityRoutes);
app.use('/api/admin', authMiddleware, reviewRoutes);

// Global error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Database connection
const connectDB = async () => {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
        throw new Error("MONGO_URI is not defined in the environment variables");
    }
    try {
        await mongoose.connect(mongoURI);
        logger.info('✅ MongoDB connected successfully');
    } catch (error) {
        logger.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Initialize AI Service
const initializeAIService = () => {
    try {
        AIService.initialize();
        logger.info('✅ AI Service initialized successfully');
    } catch (error) {
        logger.error('❌ AI Service initialization error:', error);
        logger.warn('⚠️  Whisper API will not be available. Please set OPENAI_API_KEY in your environment variables.');
    }
};

// Initialize Email Service
const initializeEmailService = () => {
    try {
        EmailService.initialize();
        logger.info('✅ Email Service initialized successfully');
    } catch (error) {
        logger.error('❌ Email Service initialization error:', error);
        logger.warn('⚠️  Email functionality will not be available. Please configure email settings in environment variables.');
    }
};

// Start server
const startServer = async () => {
    try {
        await connectDB();

        // Initialize services
        initializeReminderService();
        initializeAIService();
        initializeEmailService();

        app.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        logger.error('❌ Server startup error:', error);
        process.exit(1);
    }
};

startServer();

export default app; 