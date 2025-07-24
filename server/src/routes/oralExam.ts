import express, { Request, Response, NextFunction, Router } from 'express';
import OpenAI from 'openai';
import delfB2Questions from '../../data/delfB2Questions';
import { authMiddleware } from '../middleware/auth';
import OralExamSession from '../models/OralExamSession';

const router: Router = express.Router();

const DELF_B2_SYSTEM_PROMPT = `
Vous êtes examinateur officiel du DELF B2. Vous suivez strictement la structure de l'épreuve orale :
1. Accueil et explication rapide du déroulement (en français, 1-2 phrases).
2. Présentation du sujet à l'étudiant (en français, 1 phrase, puis posez la question sélectionnée).
3. Débattez avec l'étudiant, posez des questions de relance, jouez le rôle d'examinateur officiel, restez neutre et professionnel.
4. À la fin, fournissez une évaluation structurée :
- Notez sur 5 : Cohérence, Richesse du vocabulaire, Correction grammaticale, Prononciation.
- Donnez 2 points forts et 2 axes d'amélioration.
- Terminez par un commentaire global.
Toutes vos interventions sont en français. Ne révélez jamais la liste des sujets. Ne sortez jamais de votre rôle d'examinateur.
`;

// POST /api/oral-exam/session (start new session)
router.post('/session', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user._id;
        const question = delfB2Questions[Math.floor(Math.random() * delfB2Questions.length)];
        const messages = [
            { role: 'system', content: DELF_B2_SYSTEM_PROMPT },
            { role: 'user', content: `Sujet de l'examen : ${question}` }
        ];
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
            temperature: 0.7,
            max_tokens: 512
        });
        const aiMessage = completion.choices[0]?.message?.content || '';
        messages.push({ role: 'assistant', content: aiMessage });
        // Save session
        const session = new OralExamSession({
            user: userId,
            question,
            messages
        });
        await session.save();
        res.status(201).json({
            sessionId: session._id,
            question,
            aiMessage
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/oral-exam/session/:sessionId/message (continue conversation)
router.post('/session/:sessionId/message', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user._id;
        const { sessionId } = req.params;
        const { userMessage } = req.body;
        const session = await OralExamSession.findOne({ _id: sessionId, user: userId });
        if (!session) return res.status(404).json({ message: 'Session not found.' });
        // Add user message
        session.messages.push({ role: 'user', content: userMessage });
        // Prepare messages for OpenAI
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: session.messages,
            temperature: 0.7,
            max_tokens: 512
        });
        const aiMessage = completion.choices[0]?.message?.content || '';
        session.messages.push({ role: 'assistant', content: aiMessage });
        // If evaluation is present in AI message, extract and save (simple check)
        if (/Cohérence|Richesse du vocabulaire|Correction grammaticale|Prononciation|points forts|axes d'amélioration|commentaire global/i.test(aiMessage)) {
            session.evaluation = { commentaireGlobal: aiMessage };
        }
        await session.save();
        res.json({ aiMessage, sessionId });
    } catch (error) {
        next(error);
    }
});

// GET /api/oral-exam/sessions (list user's sessions)
router.get('/sessions', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user._id;
        const sessions = await OralExamSession.find({ user: userId }).sort({ createdAt: -1 });
        res.json({ sessions });
    } catch (error) {
        next(error);
    }
});

// GET /api/oral-exam/session/:sessionId (get single session)
router.get('/session/:sessionId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user._id;
        const { sessionId } = req.params;
        const session = await OralExamSession.findOne({ _id: sessionId, user: userId });
        if (!session) return res.status(404).json({ message: 'Session not found.' });
        res.json({ session });
    } catch (error) {
        next(error);
    }
});

export default router; 