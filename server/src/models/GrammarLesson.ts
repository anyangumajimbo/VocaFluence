import mongoose, { Schema, Document } from 'mongoose';

export interface IGrammarLesson extends Document {
  language: 'french' | 'english' | 'swahili';
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  topicId: string;
  topicName: string; // French name
  topicNameEn: string; // English name
  day: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  title: string;
  explanation: string;
  exampleSentences: string[];
  displayOrder?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GrammarLessonSchema = new Schema<IGrammarLesson>(
  {
    language: {
      type: String,
      enum: ['french', 'english', 'swahili'],
      default: 'french',
      required: true,
    },
    level: {
      type: String,
      enum: ['A1', 'A2', 'B1', 'B2', 'C1'],
      required: true,
    },
    topicId: {
      type: String,
      required: true,
      index: true,
    },
    topicName: {
      type: String,
      required: true,
    },
    topicNameEn: {
      type: String,
      required: true,
    },
    day: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    exampleSentences: [
      {
        type: String,
        required: true,
      },
    ],
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for efficient queries
GrammarLessonSchema.index({ level: 1, topicId: 1, day: 1 });
GrammarLessonSchema.index({ language: 1, level: 1, topicId: 1 });

export default mongoose.model<IGrammarLesson>('GrammarLesson', GrammarLessonSchema);
