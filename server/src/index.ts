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

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Import services
import { initializeReminderService } from './services/reminderService';
import AIService from './services/aiService';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting (needed for deployment platforms like Render)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://192.168.0.102:5173',
        'https://voca-fluence-client.vercel.app',
        'https://vocafluence-client.vercel.app',
        'https://voca-fluence-client-git-main-anyangu-majimbos-projects.vercel.app',
        'https://voca-fluence-client-lbyzqwlrl-anyangu-majimbos-projects.vercel.app'
    ],
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

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

// Start server
const startServer = async () => {
    try {
        await connectDB();

        // Initialize services
        initializeReminderService();
        initializeAIService();

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