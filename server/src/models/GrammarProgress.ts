import mongoose, { Schema, Document } from 'mongoose';

export interface IGrammarProgress extends Document {
  userId: mongoose.Types.ObjectId;
  topicId: string;
  language: 'french' | 'english' | 'swahili';
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  currentDay: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  completed: boolean;
  scores: {
    day1?: number;
    day2?: number;
    day3?: number;
    day4?: number;
    day5?: number;
    day6?: number;
    day7?: number;
    day8?: number;
    day9?: number;
    day10?: number;
  };
  lastAccessedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GrammarProgressSchema = new Schema<IGrammarProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topicId: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      enum: ['french', 'english', 'swahili'],
      default: 'french',
    },
    level: {
      type: String,
      enum: ['A1', 'A2', 'B1', 'B2', 'C1'],
      required: true,
    },
    currentDay: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      default: 1,
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    scores: {
      day1: {
        type: Number,
        default: undefined,
      },
      day2: {
        type: Number,
        default: undefined,
      },
      day3: {
        type: Number,
        default: undefined,
      },
      day4: {
        type: Number,
        default: undefined,
      },
      day5: {
        type: Number,
        default: undefined,
      },
      day6: {
        type: Number,
        default: undefined,
      },
      day7: {
        type: Number,
        default: undefined,
      },
      day8: {
        type: Number,
        default: undefined,
      },
      day9: {
        type: Number,
        default: undefined,
      },
      day10: {
        type: Number,
        default: undefined,
      },
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
GrammarProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });
GrammarProgressSchema.index({ userId: 1, completed: 1 });
GrammarProgressSchema.index({ userId: 1, level: 1 });

export default mongoose.model<IGrammarProgress>('GrammarProgress', GrammarProgressSchema);
