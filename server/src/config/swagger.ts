import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'VocaFluence API Documentation',
            version: '1.0.0',
            description: 'RESTful API for VocaFluence - A language learning platform for practicing pronunciation with AI-powered feedback',
            contact: {
                name: 'VocaFluence Support',
                email: 'support@vocafluence.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development Server',
            },
            {
                url: 'https://voca-fluence-server.onrender.com',
                description: 'Production Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token in the format: Bearer <token>',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                        firstName: { type: 'string', example: 'John' },
                        lastName: { type: 'string', example: 'Doe' },
                        role: { type: 'string', enum: ['student', 'admin'], example: 'student' },
                        preferredLanguages: {
                            type: 'array',
                            items: { type: 'string', enum: ['english', 'french', 'swahili'] },
                            example: ['english', 'french'],
                        },
                        status: { type: 'string', enum: ['active', 'inactive', 'suspended'], example: 'active' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Script: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        title: { type: 'string', example: 'Introduction to Business English' },
                        textContent: { type: 'string', example: 'Hello, my name is John...' },
                        language: { type: 'string', enum: ['english', 'french', 'swahili'], example: 'english' },
                        difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], example: 'beginner' },
                        referenceAudioURL: { type: 'string', example: 'https://cloudinary.com/audio.mp3' },
                        uploadedBy: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        tags: { type: 'array', items: { type: 'string' }, example: ['business', 'formal'] },
                        isActive: { type: 'boolean', example: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                PracticeSession: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        scriptId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        score: { type: 'number', minimum: 0, maximum: 100, example: 85 },
                        accuracy: { type: 'number', minimum: 0, maximum: 100, example: 90 },
                        fluency: { type: 'number', minimum: 0, maximum: 100, example: 80 },
                        duration: { type: 'number', example: 120 },
                        wordsPerMinute: { type: 'number', example: 150 },
                        audioUrl: { type: 'string', example: 'https://cloudinary.com/recording.webm' },
                        feedback: { type: 'string', example: 'Great pronunciation! Focus on...' },
                        transcript: { type: 'string', example: 'Hello my name is John' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Error message' },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string' },
                                    message: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/index.ts'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
