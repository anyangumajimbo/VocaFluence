import express, { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import GrammarLesson from '../models/GrammarLesson';
import GrammarProgress from '../models/GrammarProgress';
import { ActivityLog } from '../models/ActivityLog';
import AIService from '../services/aiService';

const router: Router = Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB limit for audio files
    },
    fileFilter: (req, file, cb) => {
        // Accept audio files
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'));
        }
    }
});

// Grammar Topics Data (replicated from client)
interface GrammarTopic {
  id: string;
  language: 'french';
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'B3' | 'C1';
  topicOrder: number;
  name: string;
  frenchName: string;
}

const grammarTopics: GrammarTopic[] = [
  { id: 'a1-01', language: 'french', level: 'A1', topicOrder: 1, name: 'Personal Pronouns', frenchName: 'Pronoms personnels' },
  { id: 'a1-02', language: 'french', level: 'A1', topicOrder: 2, name: 'Verb "To Be" (Être)', frenchName: 'Le verbe être' },
  { id: 'a1-03', language: 'french', level: 'A1', topicOrder: 3, name: 'Verb "To Have" (Avoir)', frenchName: 'Le verbe avoir' },
  { id: 'a1-04', language: 'french', level: 'A1', topicOrder: 4, name: 'Present Indicative - Regular -ER Verbs', frenchName: 'Présent indicatif - verbes réguliers -ER' },
  { id: 'a1-05', language: 'french', level: 'A1', topicOrder: 5, name: 'Present Indicative - Regular -IR Verbs', frenchName: 'Présent indicatif - verbes réguliers -IR' },
  { id: 'a1-06', language: 'french', level: 'A1', topicOrder: 6, name: 'Present Indicative - Regular -RE Verbs', frenchName: 'Présent indicatif - verbes réguliers -RE' },
  { id: 'a1-07', language: 'french', level: 'A1', topicOrder: 7, name: 'Definite Articles', frenchName: 'Les articles définis' },
  { id: 'a1-08', language: 'french', level: 'A1', topicOrder: 8, name: 'Indefinite Articles', frenchName: 'Les articles indéfinis' },
  { id: 'a1-09', language: 'french', level: 'A1', topicOrder: 9, name: 'Noun Gender and Number', frenchName: 'Genre et nombre des noms' },
  { id: 'a1-10', language: 'french', level: 'A1', topicOrder: 10, name: 'Adjective Agreement', frenchName: 'Accord des adjectifs' },
  { id: 'a1-11', language: 'french', level: 'A1', topicOrder: 11, name: 'Basic Prepositions', frenchName: 'Prépositions basiques' },
  { id: 'a1-12', language: 'french', level: 'A1', topicOrder: 12, name: 'Question Formation', frenchName: 'Formation des questions' },
  { id: 'a1-13', language: 'french', level: 'A1', topicOrder: 13, name: 'Negation (Ne...Pas)', frenchName: 'Négation (ne...pas)' },
  { id: 'a2-01', language: 'french', level: 'A2', topicOrder: 14, name: 'Possessive Adjectives', frenchName: 'Adjectifs possessifs' },
  { id: 'a2-02', language: 'french', level: 'A2', topicOrder: 15, name: 'Demonstrative Adjectives', frenchName: 'Adjectifs démonstratifs' },
  { id: 'a2-03', language: 'french', level: 'A2', topicOrder: 16, name: 'Partitive Articles', frenchName: 'Articles partitifs' },
  { id: 'a2-04', language: 'french', level: 'A2', topicOrder: 17, name: 'Direct Object Pronouns', frenchName: 'Pronoms compléments d\'objet direct' },
  { id: 'a2-05', language: 'french', level: 'A2', topicOrder: 18, name: 'Indirect Object Pronouns', frenchName: 'Pronoms compléments d\'objet indirect' },
  { id: 'a2-06', language: 'french', level: 'A2', topicOrder: 19, name: 'Present Indicative - Irregular Verbs', frenchName: 'Présent indicatif - verbes irréguliers' },
  { id: 'a2-07', language: 'french', level: 'A2', topicOrder: 20, name: 'Passé Composé', frenchName: 'Passé composé' },
  { id: 'a2-08', language: 'french', level: 'A2', topicOrder: 21, name: 'Imparfait', frenchName: 'Imparfait' },
  { id: 'a2-09', language: 'french', level: 'A2', topicOrder: 22, name: 'Comparative Adjectives', frenchName: 'Adjectifs comparatifs' },
  { id: 'a2-10', language: 'french', level: 'A2', topicOrder: 23, name: 'Superlative Adjectives', frenchName: 'Adjectifs superlatifs' },
  { id: 'a2-11', language: 'french', level: 'A2', topicOrder: 24, name: 'Comparative Adverbs', frenchName: 'Adverbes comparatifs' },
  { id: 'a2-12', language: 'french', level: 'A2', topicOrder: 25, name: 'Superlative Adverbs', frenchName: 'Adverbes superlatifs' },
  { id: 'a2-13', language: 'french', level: 'A2', topicOrder: 26, name: 'Near Future (Aller + Infinitive)', frenchName: 'Futur proche (aller + infinitif)' },
  { id: 'a2-14', language: 'french', level: 'A2', topicOrder: 27, name: 'Conditional Present', frenchName: 'Conditionnel présent' },
  { id: 'a2-15', language: 'french', level: 'A2', topicOrder: 28, name: 'Relative Pronouns (Qui, Que)', frenchName: 'Pronoms relatifs (qui, que)' },
  { id: 'a2-16', language: 'french', level: 'A2', topicOrder: 29, name: 'Reflexive Verbs', frenchName: 'Verbes pronominaux' },
  { id: 'a2-17', language: 'french', level: 'A2', topicOrder: 30, name: 'Past Participle Agreement', frenchName: 'Accord du participe passé' },
  { id: 'a2-18', language: 'french', level: 'A2', topicOrder: 31, name: 'More Prepositions', frenchName: 'Plus de prépositions' },
  { id: 'b1-01', language: 'french', level: 'B1', topicOrder: 32, name: 'Pluperfect (Plus-que-parfait)', frenchName: 'Plus-que-parfait' },
  { id: 'b1-02', language: 'french', level: 'B1', topicOrder: 33, name: 'Simple Future Tense', frenchName: 'Futur simple' },
  { id: 'b1-03', language: 'french', level: 'B1', topicOrder: 34, name: 'Simple Past Tense (Passé Simple)', frenchName: 'Passé simple' },
  { id: 'b1-04', language: 'french', level: 'B1', topicOrder: 35, name: 'Present Subjunctive', frenchName: 'Subjonctif présent' },
  { id: 'b1-05', language: 'french', level: 'B1', topicOrder: 36, name: 'Subjunctive vs Indicative Usage', frenchName: 'Utilisation du subjonctif vs indicatif' },
  { id: 'b1-06', language: 'french', level: 'B1', topicOrder: 37, name: 'Stressed Pronouns (Toniques)', frenchName: 'Pronoms toniques' },
  { id: 'b1-07', language: 'french', level: 'B1', topicOrder: 38, name: 'Relative Pronouns (Dont, Où)', frenchName: 'Pronoms relatifs (dont, où)' },
  { id: 'b1-08', language: 'french', level: 'B1', topicOrder: 39, name: 'Y and EN Pronouns', frenchName: 'Pronoms y et en' },
  { id: 'b1-09', language: 'french', level: 'B1', topicOrder: 40, name: 'Present Participle and Gerund', frenchName: 'Participe présent et gérondif' },
  { id: 'b1-10', language: 'french', level: 'B1', topicOrder: 41, name: 'Causative Construction (Faire + Infinitive)', frenchName: 'Construction causative (faire + infinitif)' },
  { id: 'b1-11', language: 'french', level: 'B1', topicOrder: 42, name: 'Passive Voice', frenchName: 'Voix passive' },
  { id: 'b1-12', language: 'french', level: 'B1', topicOrder: 43, name: 'Conditional Clauses (Si...)', frenchName: 'Phrases conditionnelles' },
  { id: 'b1-13', language: 'french', level: 'B1', topicOrder: 44, name: 'Indefinite Pronouns (Quelqu\'un, Personne)', frenchName: 'Pronoms indéfinis' },
  { id: 'b1-14', language: 'french', level: 'B1', topicOrder: 45, name: 'Interrogative Pronouns (Lequel, Duquel)', frenchName: 'Pronoms interrogatifs' },
  { id: 'b1-15', language: 'french', level: 'B1', topicOrder: 46, name: 'Adverbial Phrases', frenchName: 'Locutions adverbiales' },
  { id: 'b1-16', language: 'french', level: 'B1', topicOrder: 47, name: 'Agreement with Collective Nouns', frenchName: 'Accord avec les noms collectifs' },
  { id: 'b1-17', language: 'french', level: 'B1', topicOrder: 48, name: 'Indefinite Adjectives', frenchName: 'Adjectifs indéfinis' },
  { id: 'b2-01', language: 'french', level: 'B2', topicOrder: 49, name: 'Past Subjunctive', frenchName: 'Subjonctif passé' },
  { id: 'b2-02', language: 'french', level: 'B2', topicOrder: 50, name: 'Imperfect Subjunctive', frenchName: 'Subjonctif imparfait' },
  { id: 'b2-03', language: 'french', level: 'B2', topicOrder: 51, name: 'Pluperfect Subjunctive', frenchName: 'Subjonctif plus-que-parfait' },
  { id: 'b2-04', language: 'french', level: 'B2', topicOrder: 52, name: 'Conditional Perfect', frenchName: 'Conditionnel passé' },
  { id: 'b2-05', language: 'french', level: 'B2', topicOrder: 53, name: 'Future Perfect Tense', frenchName: 'Futur antérieur' },
  { id: 'b2-06', language: 'french', level: 'B2', topicOrder: 54, name: 'Narrative Tenses', frenchName: 'Temps narratifs' },
  { id: 'b2-07', language: 'french', level: 'B2', topicOrder: 55, name: 'Stylistic Inversion in Questions', frenchName: 'Inversion stylistique' },
  { id: 'b2-08', language: 'french', level: 'B2', topicOrder: 56, name: 'Pronominal Adverbs and Pronouns', frenchName: 'Adverbes et pronoms adverbiens' },
  { id: 'b2-09', language: 'french', level: 'B2', topicOrder: 57, name: 'Complex Relative Clauses', frenchName: 'Propositions relatives complexes' },
  { id: 'b2-10', language: 'french', level: 'B2', topicOrder: 58, name: 'Concessive Clauses (Bien que, Quoique)', frenchName: 'Propositions concessives' },
  { id: 'b2-11', language: 'french', level: 'B2', topicOrder: 59, name: 'Causal Clauses (Car, Parce que)', frenchName: 'Propositions causales' },
  { id: 'b2-12', language: 'french', level: 'B2', topicOrder: 60, name: 'Consecutive Clauses (Si bien que)', frenchName: 'Propositions consécutives' },
  { id: 'b2-13', language: 'french', level: 'B2', topicOrder: 61, name: 'Temporal Clauses (Quand, Lorsque)', frenchName: 'Propositions temporelles' },
  { id: 'b2-14', language: 'french', level: 'B2', topicOrder: 62, name: 'Advanced Passive Constructions', frenchName: 'Constructions passives avancées' },
  { id: 'b2-15', language: 'french', level: 'B2', topicOrder: 63, name: 'Register and Stylistic Variations', frenchName: 'Registre et variations stylistiques' },
];

function getTopicById(id: string): GrammarTopic | undefined {
  return grammarTopics.find(topic => topic.id === id);
}

function getNextTopicAfter(currentTopicId: string): GrammarTopic {
  const currentTopic = getTopicById(currentTopicId);
  if (!currentTopic) {
    return grammarTopics[0];
  }
  const nextOrder = currentTopic.topicOrder + 1;
  const nextTopic = grammarTopics.find(topic => topic.topicOrder === nextOrder);
  return nextTopic || grammarTopics[0];
}

// Apply authentication to all routes
router.use(authMiddleware);

// Helper function to get user's current progress or initialize first topic
async function getUserTodaysLesson(userId: string) {
  try {
    // Check if user has any grammar progress
    let progress = await GrammarProgress.findOne({ userId });

    if (!progress) {
      // Initialize with first topic (A1-01)
      progress = await GrammarProgress.create({
        userId,
        topicId: 'a1-01',
        language: 'french',
        level: 'A1',
        currentDay: 1,
        completed: false,
        scores: {},
      });
    }

    // Update last accessed time
    progress.lastAccessedAt = new Date();
    await progress.save();

    // Get the lesson for today
    const lesson = await GrammarLesson.findOne({
      topicId: progress.topicId,
      level: progress.level,
      day: progress.currentDay,
      language: 'french',
    });

    return { progress, lesson };
  } catch (error) {
    console.error('Error getting user daily lesson:', error);
    throw error;
  }
}

// GET /grammar/today - Get today's grammar lesson
router.get('/today', async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { progress, lesson } = await getUserTodaysLesson(userId);

    if (!lesson) {
      return res.status(404).json({ 
        error: 'Lesson not found',
        progress,
        message: 'Lesson content not yet created for this topic. Please create lesson content in the admin panel.',
      });
    }

    res.json({
      success: true,
      data: {
        progress,
        lesson,
        topic: getTopicById(progress.topicId),
      },
    });
  } catch (error) {
    console.error('Error fetching today\'s grammar lesson:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s lesson' });
  }
});

// GET /grammar/lesson/:topicId/:day - Get specific lesson
router.get('/lesson/:topicId/:day', async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { topicId, day } = req.params;
    const dayNum = parseInt(day);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (isNaN(dayNum) || dayNum < 1 || dayNum > 10) {
      return res.status(400).json({ error: 'Invalid day number' });
    }

    const topic = getTopicById(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Get progress for this specific topic
    const progress = await GrammarProgress.findOne({ userId, topicId });
    
    // Access control: user can access day 1 without any progress
    // For days 2+, they need to have completed the previous days
    if (!progress && dayNum !== 1) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You must start with Day 1. Complete it first to unlock Day 2.',
        unlockedDays: 1
      });
    }

    // If progress exists, check if they've completed enough days to access this one
    if (progress) {
      // Count how many days they've completed (have scores for)
      const completedDayCount = Object.keys(progress.scores).length;
      const maxAccessibleDay = completedDayCount + 1; // Can access up to next unlocked day
      
      if (dayNum > maxAccessibleDay) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: `You can access up to Day ${maxAccessibleDay}. Complete Day ${maxAccessibleDay} first to unlock Day ${maxAccessibleDay + 1}.`,
          unlockedDays: maxAccessibleDay
        });
      }
    }

    const lesson = await GrammarLesson.findOne({
      topicId,
      level: topic.level,
      day: dayNum,
      language: 'french',
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json({ 
      success: true, 
      data: lesson,
      userProgress: progress || null
    });
  } catch (error) {
    console.error('Error fetching grammar lesson:', error);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// GET /grammar/available - Get available lessons for user (lessons they can access)
router.get('/available', async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all lessons that exist
    const allLessons = await GrammarLesson.find({ language: 'french' })
      .sort({ level: 1, topicId: 1, day: 1 });

    // Get user's progress for ALL topics
    const allProgressRecords = await GrammarProgress.find({ userId });

    // Find the first incomplete topic (current topic)
    const currentTopic = allProgressRecords.find(p => !p.completed);
    const userProgress = currentTopic || (allProgressRecords.length > 0 ? allProgressRecords[0] : null);

    // If no progress, only day 1 is available
    if (!userProgress) {
      const day1Lessons = allLessons.filter(lesson => lesson.day === 1);
      return res.json({
        success: true,
        data: {
          lessons: day1Lessons,
          userProgress: null,
          maxAccessibleDay: 1
        }
      });
    }

    // Calculate max accessible day within current topic (completed days + 1)
    const completedDayCount = Object.keys(userProgress.scores).length;
    const maxAccessibleDay = completedDayCount + 1;

    // Filter lessons - show all days up to maxAccessibleDay for current topic,
    // and day 1 only for other topics (only if they're unlocked)
    const accessibleLessons = allLessons.filter(lesson => {
      // If it's the current topic, show days up to maxAccessibleDay
      if (lesson.topicId === userProgress.topicId) {
        return lesson.day <= maxAccessibleDay;
      }
      // For other topics, they're not accessible yet (user hasn't completed current topic)
      return false;
    });

    // Group by topic and day for easy selection
    const lessonsByTopic: Record<string, any> = {};
    accessibleLessons.forEach(lesson => {
      if (!lessonsByTopic[lesson.topicId]) {
        lessonsByTopic[lesson.topicId] = {
          topicId: lesson.topicId,
          topicName: lesson.topicName,
          topicNameEn: lesson.topicNameEn,
          level: lesson.level,
          days: []
        };
      }
      lessonsByTopic[lesson.topicId].days.push({
        day: lesson.day,
        title: lesson.title,
        _id: lesson._id,
        isCompleted: userProgress.scores[`day${lesson.day}`] !== undefined,
        score: userProgress.scores[`day${lesson.day}`]
      });
    });

    res.json({
      success: true,
      data: {
        lessons: Object.values(lessonsByTopic),
        userProgress,
        maxAccessibleDay,
        allLessons: accessibleLessons
      }
    });
  } catch (error) {
    console.error('Error fetching available lessons:', error);
    res.status(500).json({ error: 'Failed to fetch available lessons' });
  }
});

// POST /grammar/progress/save-reading - Save reading day completion with AI scoring
router.post('/progress/save-reading', upload.single('audio'), async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { topicId, day, duration = 10 } = req.body;
    const audioFile = req.file;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!topicId || !day) {
      return res.status(400).json({ error: 'Missing required fields: topicId, day' });
    }

    if (!audioFile) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    // Fetch the lesson to get expected content
    const lesson = await GrammarLesson.findOne({
      topicId,
      day: parseInt(day),
      language: 'french'
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    try {
      // Transcribe audio using Whisper API
      console.log('Starting transcription for grammar lesson:', lesson.title);
      const transcriptionResult = await AIService.transcribeAudio(audioFile.buffer, 'french');
      console.log('Transcription completed:', transcriptionResult.transcript);

      // Generate AI feedback by comparing expected content with user's reading
      const expectedContent = `${lesson.explanation} ${lesson.exampleSentences.join(' ')}`;
      const feedbackResult = await AIService.generateFeedback(
        expectedContent,
        transcriptionResult.transcript,
        parseFloat(duration) || 10
      );

      console.log('Feedback generated:', {
        score: feedbackResult.score,
        accuracy: feedbackResult.accuracy,
        fluency: feedbackResult.fluency
      });

      // Check minimum score requirement (60+)
      if (feedbackResult.score < 60) {
        return res.status(400).json({
          success: false,
          message: `Score too low (${feedbackResult.score}/100). You need 60+ to proceed. Please try again.`,
          score: feedbackResult.score,
          accuracy: feedbackResult.accuracy,
          fluency: feedbackResult.fluency,
          feedback: feedbackResult.feedbackComments,
          minimumRequired: 60
        });
      }

      // Score is 60+, proceed with saving progress
      let progress = await GrammarProgress.findOne({ userId, topicId });

      if (!progress) {
        const topic = getTopicById(topicId);
        if (!topic) {
          return res.status(400).json({ error: 'Invalid topic' });
        }

        progress = await GrammarProgress.create({
          userId,
          topicId,
          language: 'french',
          level: topic.level,
          currentDay: 1,
          completed: false,
          scores: {},
        });
      }

      // Update score for the current day
      const dayKey = `day${day}` as 'day1' | 'day2' | 'day3' | 'day4' | 'day5' | 'day6' | 'day7' | 'day8' | 'day9' | 'day10';
      progress.scores[dayKey] = Math.round(feedbackResult.score);

      // Check if this topic is now complete by finding max day for this topic
      const topicLessons = await GrammarLesson.find({
        topicId,
        language: 'french',
        level: progress.level
      });
      const maxDayForTopic = Math.max(...topicLessons.map(l => l.day));

      // If this is the last day of the topic, mark as completed and advance to next topic
      if (day === maxDayForTopic) {
        progress.completed = true;
        progress.completedAt = new Date();

        // Create progress for next topic
        const nextTopic = getNextTopicAfter(topicId);
        let nextProgress = await GrammarProgress.findOne({
          userId,
          topicId: nextTopic.id,
        });

        if (!nextProgress) {
          nextProgress = await GrammarProgress.create({
            userId,
            topicId: nextTopic.id,
            language: 'french',
            level: nextTopic.level,
            currentDay: 1,
            completed: false,
            scores: {},
          });
        } else {
          nextProgress.currentDay = 1;
          nextProgress.completed = false;
          nextProgress.scores = {};
        }

        await nextProgress.save();
      } else {
        // Not the last day: advance to next day
        progress.currentDay = (day + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
      }

      await progress.save();

      // Get topic name for activity log
      const topic = getTopicById(topicId);
      const topicName = topic?.frenchName || topic?.name || 'Grammar';

      // Create activity log entry (only when topic is fully completed)
      if (progress.completed) {
        await ActivityLog.create({
          userId,
          activityType: 'grammar',
          title: `${topicName} - Completed`,
          description: `Level: ${progress.level}`,
          score: Math.round(
            Object.values(progress.scores).reduce((a: any, b: any) => (a || 0) + (b || 0), 0) /
            Object.values(progress.scores).length
          ),
          duration: 0,
        });
      }

      res.json({
        success: true,
        message: `Excellent! Score: ${feedbackResult.score}/100. Moving to next lesson...`,
        score: feedbackResult.score,
        accuracy: feedbackResult.accuracy,
        fluency: feedbackResult.fluency,
        feedback: feedbackResult.feedbackComments,
        data: progress,
      });
    } catch (aiError: any) {
      console.error('AI Service error:', aiError);
      return res.status(500).json({
        success: false,
        message: aiError.message || 'Failed to evaluate recording',
        error: 'Audio evaluation failed'
      });
    }
  } catch (error) {
    console.error('Error saving reading progress:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// POST /grammar/progress/complete-exam - Complete day 6 exam
router.post('/progress/complete-exam', async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { topicId, score, feedback } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!topicId || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const progress = await GrammarProgress.findOne({ userId, topicId });
    if (!progress) {
      return res.status(404).json({ error: 'Progress record not found' });
    }

    // Save day 10 score
    progress.scores.day10 = score;
    progress.completed = true;
    progress.completedAt = new Date();

    // Create progress for next topic
    const nextTopic = getNextTopicAfter(topicId);
    let nextProgress = await GrammarProgress.findOne({
      userId,
      topicId: nextTopic.id,
    });

    if (!nextProgress) {
      nextProgress = await GrammarProgress.create({
        userId,
        topicId: nextTopic.id,
        language: 'french',
        level: nextTopic.level,
        currentDay: 1,
        completed: false,
        scores: {},
      });
    } else {
      nextProgress.currentDay = 1;
      nextProgress.completed = false;
      nextProgress.scores = {};
    }

    await Promise.all([progress.save(), nextProgress.save()]);

    res.json({
      success: true,
      message: 'Exam completed successfully',
      data: {
        completedTopic: progress,
        nextTopic: nextProgress,
      },
    });
  } catch (error) {
    console.error('Error completing exam:', error);
    res.status(500).json({ error: 'Failed to complete exam' });
  }
});

// GET /grammar/stats - Get grammar completion statistics
router.get('/stats', async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const completedCount = await GrammarProgress.countDocuments({
      userId,
      completed: true,
    });

    const currentProgress = await GrammarProgress.findOne({
      userId,
      completed: false,
    }).sort({ createdAt: 1 });

    const statsByLevel = await GrammarProgress.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId(userId), completed: true } },
      { $group: { _id: '$level', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        totalCompleted: completedCount,
        currentProgress,
        statsByLevel: Object.fromEntries(
          statsByLevel.map((s: any) => [s._id, s.count])
        ),
      },
    });
  } catch (error) {
    console.error('Error fetching grammar stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /grammar/history - Get user's grammar learning history
router.get('/history', async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { skip = 0, limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const skipNum = parseInt(skip as string) || 0;
    const limitNum = parseInt(limit as string) || 10;

    // Get completed grammar progress
    const completedProgress = await GrammarProgress.find({
      userId,
      completed: true,
    })
      .sort({ completedAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    // Get total count for pagination
    const totalCount = await GrammarProgress.countDocuments({
      userId,
      completed: true,
    });

    // Enrich with topic information
    const historyWithDetails = completedProgress.map((progress) => {
      const topic = getTopicById(progress.topicId);
      const avgScore = Object.values(progress.scores).length > 0
        ? Math.round(
            (Object.values(progress.scores).reduce((a: any, b: any) => (a || 0) + (b || 0), 0) /
              Object.values(progress.scores).length) as number
          )
        : 0;

      return {
        _id: progress._id,
        topicId: progress.topicId,
        topicName: topic?.frenchName || topic?.name || 'Unknown Topic',
        level: progress.level,
        scores: progress.scores,
        avgScore,
        completedAt: progress.completedAt,
        createdAt: progress.createdAt,
      };
    });

    res.json({
      success: true,
      data: {
        history: historyWithDetails,
        pagination: {
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum),
          current: skipNum / limitNum + 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching grammar history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});
// ==================== ADMIN ENDPOINTS ====================

// Middleware to check admin role
const checkAdmin = (req: any, res: Response, next: NextFunction): any => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Create admin sub-router
const adminRouter = Router();
adminRouter.use(checkAdmin);

// POST /grammar/admin/lesson - Create new grammar lesson
adminRouter.post('/lesson', async (req: any, res: Response): Promise<any> => {
  try {
    const { language, level, topicId, topicName, topicNameEn, day, title, explanation, exampleSentences } = req.body;

    if (!level || !topicId || !day || !title || !explanation || !exampleSentences) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const lesson = await GrammarLesson.create({
      language: language || 'french',
      level,
      topicId,
      topicName,
      topicNameEn,
      day,
      title,
      explanation,
      exampleSentences,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: lesson,
    });
  } catch (error) {
    console.error('Error creating grammar lesson:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

// PUT /grammar/admin/lesson/:id - Update grammar lesson
adminRouter.put('/lesson/:id', async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { title, explanation, exampleSentences, isActive } = req.body;

    const lesson = await GrammarLesson.findByIdAndUpdate(
      id,
      { title, explanation, exampleSentences, isActive },
      { new: true, runValidators: true }
    );

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json({
      success: true,
      message: 'Lesson updated successfully',
      data: lesson,
    });
  } catch (error) {
    console.error('Error updating grammar lesson:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// DELETE /grammar/admin/lesson/:id - Delete grammar lesson
adminRouter.delete('/lesson/:id', async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const lesson = await GrammarLesson.findByIdAndDelete(id);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json({
      success: true,
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting grammar lesson:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

// GET /grammar/admin/lessons/:level - Get all lessons for a level
adminRouter.get('/lessons/:level', async (req: any, res: Response): Promise<any> => {
  try {
    const { level } = req.params;

    if (!['A1', 'A2', 'B1', 'B2', 'C1'].includes(level)) {
      return res.status(400).json({ error: 'Invalid level' });
    }

    const lessons = await GrammarLesson.find({ level, language: 'french' }).sort({
      topicId: 1,
      day: 1,
    });

    res.json({
      success: true,
      data: lessons,
    });
  } catch (error) {
    console.error('Error fetching lessons by level:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// GET /grammar/admin/topics - Get all available topics for lesson creation
adminRouter.get('/topics', async (req: any, res: Response): Promise<any> => {
  try {
    res.json({
      success: true,
      data: grammarTopics,
    });
  } catch (error) {
    console.error('Error fetching grammar topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// Register admin sub-router
router.use('/admin', adminRouter);

export default router;
