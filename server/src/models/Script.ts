import mongoose, { Document, Schema } from 'mongoose';

export interface IScript extends Document {
    title: string;
    textContent: string;
    language: 'english' | 'french' | 'swahili';
    referenceAudioURL?: string;
    uploadedBy: mongoose.Types.ObjectId;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const scriptSchema = new Schema<IScript>({
    title: {
        type: String,
        required: [true, 'Script title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    textContent: {
        type: String,
        required: [true, 'Script content is required'],
        trim: true
    },
    language: {
        type: String,
        required: [true, 'Language is required'],
        enum: ['english', 'french', 'swahili']
    },
    referenceAudioURL: {
        type: String,
        trim: true
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Uploader is required']
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    tags: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
scriptSchema.index({ language: 1, isActive: 1 });
scriptSchema.index({ uploadedBy: 1 });

export const Script = mongoose.model<IScript>('Script', scriptSchema); 