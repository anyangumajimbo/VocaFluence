import mongoose, { Schema, Document } from 'mongoose';

export interface IPracticeSession extends Document {
    userId: mongoose.Types.ObjectId;
    scriptId: mongoose.Types.ObjectId;
    score: number;
    accuracy: number;
    fluency: number;
    duration: number;
    wordsPerMinute?: number;
    audioUrl?: string;
    feedback?: string;
    transcript?: string; // Store the transcribed text
    createdAt: Date;
    updatedAt: Date;
}

const PracticeSessionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    scriptId: {
        type: Schema.Types.ObjectId,
        ref: 'Script',
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    accuracy: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    fluency: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    duration: {
        type: Number,
        required: true,
        min: 0
    },
    wordsPerMinute: {
        type: Number,
        min: 0
    },
    audioUrl: {
        type: String
    },
    feedback: {
        type: String
    },
    transcript: {
        type: String
    }
}, {
    timestamps: true
});

export const PracticeSession = mongoose.model<IPracticeSession>('PracticeSession', PracticeSessionSchema); 