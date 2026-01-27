import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'student' | 'admin';
    preferredLanguages: ('english' | 'french' | 'swahili')[];
    schedule: {
        frequency: 'daily' | 'weekly' | 'custom';
        customDays?: string[];
        reminderTime?: string;
    };
    reminderSettings?: {
        enabled: boolean;
        frequency: 'daily' | 'weekly';
        time: string;
        timezone: string;
    };
    lastReminder?: Date;
    totalReminders?: number;
    streakDays?: number;
    longestStreak?: number;
    lastPracticeDate?: Date;
    status?: 'active' | 'inactive' | 'suspended';
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    preferredLanguages: [{
        type: String,
        enum: ['english', 'french', 'swahili']
    }],
    schedule: {
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'custom'],
            default: 'daily'
        },
        customDays: [{
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        }],
        reminderTime: {
            type: String,
            default: '09:00'
        }
    },
    reminderSettings: {
        enabled: {
            type: Boolean,
            default: false
        },
        frequency: {
            type: String,
            enum: ['daily', 'weekly'],
            default: 'daily'
        },
        time: {
            type: String,
            default: '09:00'
        },
        timezone: {
            type: String,
            default: 'UTC'
        }
    },
    lastReminder: {
        type: Date
    },
    totalReminders: {
        type: Number,
        default: 0
    },
    streakDays: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
    },
    lastPracticeDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Combined pre-save hook for hashing and validation
userSchema.pre('save', function (next) {
    if (this.isModified('password')) {
        if (!this.password.startsWith('$2a$')) {
            const salt = bcrypt.genSaltSync(12);
            this.password = bcrypt.hashSync(this.password, salt);
        }
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

export const User = mongoose.model<IUser>('User', userSchema);