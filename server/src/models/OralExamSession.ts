import mongoose, { Document, Schema } from 'mongoose';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface Evaluation {
    coherence?: number;
    vocabulaire?: number;
    grammaire?: number;
    prononciation?: number;
    totalScore?: number;
    pointsForts?: string[];
    axesAmelioration?: string[];
    commentaireGlobal?: string;
}

export interface OralExamSessionDocument extends Document {
    user: mongoose.Types.ObjectId;
    question: string;
    topicId?: string;
    messages: Message[];
    evaluation?: Evaluation;
    evaluationSaved?: boolean;
    createdAt: Date;
}

const MessageSchema = new Schema<Message>({
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true }
}, { _id: false });

const EvaluationSchema = new Schema<Evaluation>({
    coherence: Number,
    vocabulaire: Number,
    grammaire: Number,
    prononciation: Number,
    totalScore: Number,
    pointsForts: [String],
    axesAmelioration: [String],
    commentaireGlobal: String
}, { _id: false });

const OralExamSessionSchema = new Schema<OralExamSessionDocument>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true },
    topicId: { type: String, required: false },
    messages: { type: [MessageSchema], required: true },
    evaluation: { type: EvaluationSchema, required: false },
    evaluationSaved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const OralExamSession = mongoose.model<OralExamSessionDocument>('OralExamSession', OralExamSessionSchema);

export default OralExamSession; 