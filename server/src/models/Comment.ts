import { Schema, model, Document, Types } from 'mongoose';

export interface IComment extends Document {
    activityId: Types.ObjectId;
    studentId: Types.ObjectId;
    adminId: Types.ObjectId;
    text: string;
    referenceAudio?: string; // Path to reference audio file
    status: 'pending' | 'reviewed' | 'resolved';
    createdAt: Date;
    updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
    {
        activityId: {
            type: Schema.Types.ObjectId,
            ref: 'ActivityLog',
            required: true,
        },
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        adminId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
        },
        referenceAudio: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'resolved'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
commentSchema.index({ activityId: 1 });
commentSchema.index({ studentId: 1, createdAt: -1 });
commentSchema.index({ adminId: 1, createdAt: -1 });

export default model<IComment>('Comment', commentSchema);
