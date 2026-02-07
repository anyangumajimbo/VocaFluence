const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  language: String,
  level: String,
  topicId: String,
  topicName: String,
  topicNameEn: String,
  day: Number,
  title: String,
  explanation: String,
  exampleSentences: [String],
  isActive: Boolean
});

const GrammarLesson = mongoose.model('GrammarLesson', lessonSchema);

const lessons = [
  // Topic 1: Personal Pronouns (2 days)
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
      'Ils sont ingénieurs.',
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
      'Elle parle italien.',
      'Nous parlons allemand.',
      'Vous parlez portugais.',
      'Ils parlent français et anglais.',
      'Elles parlent trois langues.'
    ],
    isActive: true,
  },
  // Topic 2: The Verb "Être" (2 days)
  {
    language: 'french',
    level: 'A1',
    topicId: 'a1-02',
    topicName: 'Le verbe être',
    topicNameEn: 'Verb "To Be" (Être)',
    day: 1,
    title: 'The Verb "Être" (To Be) - Part 1',
    explanation: 'The verb "être" is one of the most important verbs in French. It is irregular, meaning it does not follow standard conjugation patterns. The present tense conjugation is: je suis, tu es, il/elle est, nous sommes, vous êtes, ils/elles sont. This verb is used to describe states of being and characteristics.',
    exampleSentences: [
      'Je suis content(e).',
      'Tu es intelligent(e).',
      'Il est grand.',
      'Elle est petite.',
      'Nous sommes heureux(ses).',
      'Vous êtes timide.',
      'Ils sont sportifs.',
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
    day: 2,
    title: 'The Verb "Être" - Professions and Nationalities',
    explanation: 'The verb "être" is used with professions and nationalities to describe what someone does or where they are from. Unlike English, French does not use an article before professions after "être". For example: "Je suis médecin" (I am a doctor), not "Je suis un médecin".',
    exampleSentences: [
      'Je suis dentiste.',
      'Tu es infirmier(ère).',
      'Il est architecte.',
      'Elle est avocate.',
      'Nous sommes professeurs.',
      'Vous êtes ingénieur(e)s.',
      'Ils sont français.',
      'Elles sont allemandes.'
    ],
    isActive: true,
  },
  // Topic 3: The Verb "Avoir" (2 days)
  {
    language: 'french',
    level: 'A1',
    topicId: 'a1-03',
    topicName: 'Le verbe avoir',
    topicNameEn: 'Verb "To Have" (Avoir)',
    day: 1,
    title: 'The Verb "Avoir" (To Have) - Part 1',
    explanation: 'The verb "avoir" is another fundamental French verb. Like "être", it is irregular. The present tense conjugation is: j\'ai, tu as, il/elle a, nous avons, vous avez, ils/elles ont. "Avoir" is used to express possession and is also auxiliary in compound past tenses.',
    exampleSentences: [
      'J\'ai un chat.',
      'Tu as une maison.',
      'Il a une voiture.',
      'Elle a un ordinateur.',
      'Nous avons des livres.',
      'Vous avez une famille.',
      'Ils ont des amis.',
      'Elles ont des talents.'
    ],
    isActive: true,
  },
  {
    language: 'french',
    level: 'A1',
    topicId: 'a1-03',
    topicName: 'Le verbe avoir',
    topicNameEn: 'Verb "To Have" (Avoir)',
    day: 2,
    title: 'The Verb "Avoir" - Expressions with Avoir',
    explanation: 'In French, many common expressions use "avoir" where English uses "to be". For example: "avoir faim" (to be hungry), "avoir soif" (to be thirsty), "avoir peur" (to be afraid), "avoir raison" (to be right), "avoir tort" (to be wrong).',
    exampleSentences: [
      'J\'ai faim.',
      'Tu as soif.',
      'Il a peur.',
      'Elle a raison.',
      'Nous avons tort.',
      'Vous avez sommeil.',
      'Ils ont chaud.',
      'Elles ont froid.'
    ],
    isActive: true,
  },
  // Topic 4: Definite Articles (2 days)
  {
    language: 'french',
    level: 'A1',
    topicId: 'a1-04',
    topicName: 'Les articles définis',
    topicNameEn: 'Definite Articles',
    day: 1,
    title: 'Definite Articles - The Words',
    explanation: 'Definite articles are used to refer to specific, known nouns. In French, definite articles are: le (masculine singular), la (feminine singular), l\' (before vowels), les (plural). The article changes based on the gender and number of the noun it modifies.',
    exampleSentences: [
      'Le livre est sur la table.',
      'La maison est belle.',
      'L\'école est fermée.',
      'Les enfants jouent.',
      'Le chat noir dort.',
      'La robe rouge est jolie.',
      'L\'université est grande.',
      'Les fleurs sont rouges.'
    ],
    isActive: true,
  },
  {
    language: 'french',
    level: 'A1',
    topicId: 'a1-04',
    topicName: 'Les articles définis',
    topicNameEn: 'Definite Articles',
    day: 2,
    title: 'Using Definite Articles in Sentences',
    explanation: 'When to use definite articles: with specific nouns you are discussing, with languages before verbs like "parler", with days of the week, with parts of the body. Never use definite articles with names of people (unless speaking generally about them).',
    exampleSentences: [
      'Je parle le français et l\'anglais.',
      'Le lundi, je vais à l\'école.',
      'Elle se lave les mains.',
      'Le professeur est sympa.',
      'La physique est difficile.',
      'L\'homme est grand.',
      'Les sciences sont intéressantes.',
      'Le football est un sport populaire.'
    ],
    isActive: true,
  },
  // Topic 5: Indefinite Articles (2 days)
  {
    language: 'french',
    level: 'A1',
    topicId: 'a1-05',
    topicName: 'Les articles indéfinis',
    topicNameEn: 'Indefinite Articles',
    day: 1,
    title: 'Indefinite Articles - A/An',
    explanation: 'Indefinite articles refer to non-specific or unknown nouns. In French, indefinite articles are: un (masculine singular), une (feminine singular), des (plural). Use indefinite articles when mentioning something for the first time or when the specific thing is not important.',
    exampleSentences: [
      'J\'ai un chat.',
      'Elle a une maison.',
      'Nous avons des amis.',
      'C\'est un livre.',
      'C\'est une école.',
      'Ce sont des enfants.',
      'Il y a un arbre dans le jardin.',
      'Il y a une fleur rouge.'
    ],
    isActive: true,
  },
  {
    language: 'french',
    level: 'A1',
    topicId: 'a1-05',
    topicName: 'Les articles indéfinis',
    topicNameEn: 'Indefinite Articles',
    day: 2,
    title: 'Contrasting Definite and Indefinite Articles',
    explanation: 'The difference between definite and indefinite articles: use "le/la" for specific things you know about, use "un/une" for things mentioned for the first time or things in general. Example: "Je vois un chat sur la table" (I see a cat on the table) vs "Le chat sur la table est noir" (The cat on the table is black).',
    exampleSentences: [
      'C\'est un professeur. Le professeur est gentil.',
      'J\'ai une voiture. La voiture est rouge.',
      'Il y a des livres. Les livres sont intéressants.',
      'C\'est un chat noir.',
      'La fille a un frère.',
      'Un homme marche dans la rue.',
      'Un jour, une fée est venue.',
      'Les enfants jouent avec un ballon.'
    ],
    isActive: true,
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/vocafluence');
    console.log('✅ Connected to MongoDB\n');

    // Find and clear existing A1 lessons
    const existing = await GrammarLesson.countDocuments({ level: 'A1' });
    if (existing > 0) {
      await GrammarLesson.deleteMany({ level: 'A1' });
      console.log(`Found ${existing} existing A1 lessons. Clearing them first...\n`);
    }

    // Insert corrected lessons
    const result = await GrammarLesson.insertMany(lessons);
    console.log(`✅ Successfully added ${result.length} grammar lessons!\n`);

    // Display what was added
    console.log('📚 Lessons in database:\n');
    console.log('A1 Level:');
    
    const byTopic = {};
    result.forEach(lesson => {
      if (!byTopic[lesson.topicId]) {
        byTopic[lesson.topicId] = [];
      }
      byTopic[lesson.topicId].push(lesson);
    });

    Object.values(byTopic).forEach(topicLessons => {
      const topic = topicLessons[0];
      console.log(`  📖 ${topic.topicName} (${topic.topicNameEn}) - ${topicLessons.length} days`);
      topicLessons.forEach(lesson => {
        console.log(`     Day ${lesson.day}: ${lesson.title}`);
      });
    });

    console.log('\n✨ Seeding complete!');
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();
