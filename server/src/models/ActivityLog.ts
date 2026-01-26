import mongoose, { Schema, Document } from 'mongoose';

export type ActivityType = 'practice' | 'oral_exam' | 'vocabulary' | 'listening';

export interface IActivityLog extends Document {
    userId: mongoose.Types.ObjectId;
    activityType: ActivityType;
    title: string;
    description?: string;
    textContent?: string; // The text being practiced/examined
    audioUrl?: string; // URL or path to the recording
    audioBuffer?: Buffer; // Audio file stored as buffer
    score?: number;
    accuracy?: number;
    fluency?: number;
    duration: number; // in seconds
    transcript?: string; // Transcribed speech
    feedback?: string;
    relatedId?: mongoose.Types.ObjectId; // References to ScriptId or ExamSessionId
    createdAt: Date;
    updatedAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        activityType: {
            type: String,
            enum: ['practice', 'oral_exam', 'vocabulary', 'listening'],
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        textContent: {
            type: String // Full text of script, topic, etc.
        },
        audioUrl: {
            type: String // URL if stored externally
        },
        audioBuffer: {
            type: Buffer // For storing audio as binary data
        },
        score: {
            type: Number,
            min: 0,
            max: 100
        },
        accuracy: {
            type: Number,
            min: 0,
            max: 100
        },
        fluency: {
            type: Number,
            min: 0,
            max: 100
        },
        duration: {
            type: Number,
            required: true,
            min: 0
        },
        transcript: {
            type: String // What the user actually said
        },
        feedback: {
            type: String // AI feedback
        },
        relatedId: {
            type: Schema.Types.ObjectId // Reference to Script, OralExamSession, etc.
        }
    },
    {
        timestamps: true,
        collection: 'activity_logs'
    }
);

// Index for efficient querying
ActivityLogSchema.index({ userId: 1, activityType: 1, createdAt: -1 });
ActivityLogSchema.index({ userId: 1, createdAt: -1 });

const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

export { ActivityLog };
