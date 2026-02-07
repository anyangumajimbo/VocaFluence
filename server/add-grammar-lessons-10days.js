const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Define GrammarLesson schema inline
const grammarLessonSchema = new mongoose.Schema({
  language: { type: String, required: true, default: 'french' },
  level: { type: String, required: true, enum: ['A1', 'A2', 'B1', 'B2', 'C1'] },
  topicId: { type: String, required: true },
  topicName: String,
  topicNameEn: String,
  day: { type: Number, required: true, enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  title: { type: String, required: true },
  explanation: { type: String, required: true },
  exampleSentences: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const GrammarLesson = mongoose.model('GrammarLesson', grammarLessonSchema);

// Sample A1 lessons for 10 days
const a1Lessons = [
  // Personal Pronouns - Days 1-2
  {
    language: 'french',
    level: 'A1',
    topicId: 'a1-01',
    topicName: 'Pronoms personnels',
    topicNameEn: 'Personal Pronouns',
    day: 1,
    title: 'Introduction to Personal Pronouns',
    explanation: 'Personal pronouns are words that replace nouns to refer to people. In French, the personal pronouns are: je (I), tu (you - informal), il/elle (he/she), nous (we), vous (you - formal/plural), ils/elles (they). These pronouns are essential in French as they determine the verb conjugation.',
    exampleSentences: [
      'Je suis français(e).',
      'Tu es étudiant(e).',
      'Il est médecin.',
      'Elle est avocate.',
      'Nous sommes amis.',
      'Vous êtes professeurs.',
      'Ils sont engineers.',
      'Elles sont artistes.'
    ],
    isActive: true,
  },
  {
    language: 'french',
    level: 'A1',
    topicId: 'a1-01',
    topicName: 'Pronoms personnels',
    topicNameEn: 'Personal Pronouns',
    day: 2,
    title: 'Using Personal Pronouns with Verbs',
    explanation: 'Personal pronouns work closely with verbs. Each pronoun has a corresponding verb form. For example, with the verb "parler" (to speak): je parle, tu parles, il/elle parle, nous parlons, vous parlez, ils/elles parlent. The pronoun and verb form must agree.',
    exampleSentences: [
      'Je parle français.',
      'Tu parles anglais.',
      'Il parle espagnol.',
      'Nous parlons italienne.',
      'Vous parlez allemand.',
      'Elles parlent portugais.'
    ],
    isActive: true,
  },

  // Verb "To Be" - Days 3-4
  {
    language: 'french',
    level: 'A1',
    topicId: 'a1-02',
    topicName: 'Le verbe être',
    topicNameEn: 'Verb "To Be" (Être)',
    day: 3,
    title: 'The Verb "Être" (To Be) - Part 1',
    explanation: 'The verb "être" is one of the most important verbs in French. It is irregular, meaning it does not follow standard conjugation patterns. The present tense conjugation is: je suis, tu es, il/elle est, nous sommes, vous êtes, ils/elles sont. This verb is used to describe states of being and characteristics.',
    exampleSentences: [
      'Je suis content(e).',
      'Tu es intelligent(e).',
      'Il est grand.',
      'Elle est petite.',
      'Nous sommes heureux(ses).',
      'Vous êtes timide.',
      'Ils sont sports.',
      'Elles sont musicales.'
    ],
    isActive: true,
  },
  {
    language: 'french',
    level: 'A1',
    topicId: 'a1-02',
    topicName: 'Le verbe être',
    topicNameEn: 'Verb "To Be" (Être)',
    day: 4,
    title: 'The Verb "Être" - Professions and Nationalities',
    explanation: 'The verb "être" is used with professions and nationalities to describe what someone does or where they are from. Unlike English, French does not use an article before professions after "être". For example: "Je suis médecin" (I am a doctor), not "Je suis un médecin".',
    exampleSentences: [
      'Je suis dentiste.',
      'Tu es professeur.',
      'Il est acteur.',
      'Elle est avocate.',
      'Nous sommes français(es).',
      'Vous êtes anglais(es).',
      'Ils sont italiens.',
      'Elles sont allemandes.'
    ],
    isActive: true,
  },

  // Verb "To Have" - Days 5-6
  {
    language: 'french',
    level: 'A1',
    topicId: 'a1-03',
    topicName: 'Le verbe avoir',
    topicNameEn: 'Verb "To Have" (Avoir)',
    day: 5,
    title: 'The Verb "Avoir" (To Have) - Part 1',
    explanation: 'The verb "avoir" is another essential irregular verb in French. The present tense conjugation is: j\'ai, tu as, il/elle a, nous avons, vous avez, ils/elles ont. This verb expresses possession and is also used in compound past tenses. It is crucial to master this verb.',
    exampleSentences: [
      'J\'ai un frère.',
      'Tu as une soeur.',
      'Il a une voiture.',
      'Elle a un chat.',
      'Nous avons une maison.',
      'Vous avez un chien.',
      'Ils ont des enfants.',
      'Elles ont un jardin.'
    ],
    isActive: true,
  },
  {
    language: 'french',
    level: 'A1',
    topicId: 'a1-03',
    topicName: 'Le verbe avoir',
    topicNameEn: 'Verb "To Have" (Avoir)',
    day: 6,
    title: 'The Verb "Avoir" - Expressions',
    explanation: 'The verb "avoir" is used in many common French expressions. For example, "avoir faim" (to be hungry - literally "to have hunger"), "avoir soif" (to be thirsty), "avoir peur" (to be afraid), "avoir chaud" (to be warm), and "avoir froid" (to be cold). These expressions use "avoir" instead of the English equivalents.',
    exampleSentences: [
      'J\'ai faim.',
      'Tu as soif.',
      'Il a peur.',
      'Elle a chaud.',
      'Nous avons froid.',
      'Vous avez mal à la tête.',
      'Ils ont sommeil.',
      'Elles ont raison.'
    ],
    isActive: true,
  },

  // Definite Articles - Days 7-8
  {
    language: 'french',
    level: 'A1',
    topicId: 'a1-07',
    topicName: 'Les articles définis',
    topicNameEn: 'Definite Articles',
    day: 7,
    title: 'Definite Articles - The Words',
    explanation: 'Definite articles are used to refer to specific nouns. In French, they are: le (masculine singular), la (feminine singular), l\' (before a vowel sound), and les (plural). The choice depends on the gender and number of the noun. For example: "le chat" (the cat - masculine), "la maison" (the house - feminine), "l\'école" (the school - before vowel).',
    exampleSentences: [
      'Le chat est noir.',
      'La maison est grande.',
      'L\'école est belle.',
      'Les enfants jouent.',
      'Le livre est intéressant.',
      'La table est ronde.',
      'L\'arbre est très haut.',
      'Les fleurs sont colorées.'
    ],
    isActive: true,
  },
  {
    language: 'french',
    level: 'A1',
    topicId: 'a1-07',
    topicName: 'Les articles définis',
    topicNameEn: 'Definite Articles',
    day: 8,
    title: 'Using Definite Articles in Sentences',
    explanation: 'Definite articles are required in French in many contexts where English would not use "the". French speakers must include the article even when it seems redundant in English. This is a crucial difference between the two languages.',
    exampleSentences: [
      'Le français est une belle langue.',
      'La grammaire français est difficile.',
      'Les étudiants aiment l\'histoire.',
      'Je préfère le chocolat.',
      'Elle adore la musique.',
      'Ils étudient les mathématiques.',
      'Vous comprenez l\'anglais?',
      'Nous regardons le film.'
    ],
    isActive: true,
  },

  // Indefinite Articles - Days 9-10
  {
    language: 'french',
    level: 'A1',
    topicId: 'a1-08',
    topicName: 'Les articles indéfinis',
    topicNameEn: 'Indefinite Articles',
    day: 9,
    title: 'Indefinite Articles - A/An',
    explanation: 'Indefinite articles refer to unspecified nouns. In French, they are: un (masculine singular), une (feminine singular), and des (plural). They are used when referring to something for the first time or when its specific identity is unknown. For example: "un chat" (a cat), "une maison" (a house), "des livres" (some books).',
    exampleSentences: [
      'J\'ai un chat.',
      'Elle a une maison.',
      'Il a un chien.',
      'Nous avons des enfants.',
      'Tu as une amie.',
      'Vous avez un jardin.',
      'Ils ont des livres.',
      'Elles ont une voiture.'
    ],
    isActive: true,
  },
  {
    language: 'french',
    level: 'A1',
    topicId: 'a1-08',
    topicName: 'Les articles indéfinis',
    topicNameEn: 'Indefinite Articles',
    day: 10,
    title: 'Contrasting Definite and Indefinite Articles',
    explanation: 'It is important to understand the difference between definite and indefinite articles in French. Definite articles (le, la, les) refer to specific things, while indefinite articles (un, une, des) refer to unspecified things. "Le chat noir" = the specific black cat, "Un chat noir" = a (some) black cat.',
    exampleSentences: [
      'J\'ai un livre et le livre est intéressant.',
      'Elle a une soeur et la soeur est étudiante.',
      'Il aime un professeur mais le professeur est strict.',
      'Nous avons des amis et les amis sont sympas.',
      'Tu as une maison? Oui, et la maison est grande.',
      'Vous avez des questions? Oui, les questions sont difficiles.',
      'Ils ont un chien et le chien est très mignon.',
      'Elles achètent une voiture et la voiture est rouge.'
    ],
    isActive: true,
  },
];

const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/vocafluence';
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Check if lessons already exist
    const existingCount = await GrammarLesson.countDocuments({
      level: 'A1',
    });

    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing A1 lessons. Clearing them first...`);
      await GrammarLesson.deleteMany({ level: 'A1' });
    }

    // Insert the lessons
    const result = await GrammarLesson.insertMany(a1Lessons);
    console.log(`✅ Successfully added ${result.length} grammar lessons (10 days)!`);

    // Display summary
    const allLessons = await GrammarLesson.find({}).sort({ level: 1, topicId: 1, day: 1 });
    console.log('\n📚 Lessons in database:');
    
    // Group by level
    const byLevel = {};
    allLessons.forEach(lesson => {
      if (!byLevel[lesson.level]) {
        byLevel[lesson.level] = [];
      }
      byLevel[lesson.level].push(lesson);
    });

    Object.keys(byLevel).forEach(level => {
      console.log(`\n${level} Level:`);
      const lessons = byLevel[level];
      
      // Group by topic within level
      const byTopic = {};
      lessons.forEach(lesson => {
        if (!byTopic[lesson.topicId]) {
          byTopic[lesson.topicId] = [];
        }
        byTopic[lesson.topicId].push(lesson);
      });

      Object.keys(byTopic).forEach(topicId => {
        const topicLessons = byTopic[topicId];
        const topic = topicLessons[0];
        console.log(`  📖 ${topic.topicName} (${topic.topicNameEn}) - ${topicLessons.length} days`);
        topicLessons.forEach(lesson => {
          console.log(`     Day ${lesson.day}: ${lesson.title}`);
        });
      });
    });

    console.log('\n✨ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
