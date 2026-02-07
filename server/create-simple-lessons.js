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
  {
    language: 'french',
    level: 'A1',
    topicId: 'lesson-01',
    topicName: 'Leçon 1',
    topicNameEn: 'Lesson 1',
    day: 1,
    title: 'Introduction to French',
    explanation: 'Welcome to Lesson 1! In this lesson, you will learn the basics of French greetings and how to introduce yourself. Learning a new language starts with the simplest words and phrases.',
    exampleSentences: [
      'Bonjour, je suis heureux de vous rencontrer.',
      'Comment allez-vous?',
      'Je m\'appelle Marie.',
      'Enchanté(e) de vous rencontrer.',
      'Bonsoir, ça va?',
      'Ça va bien, merci!',
      'Bonne journée!',
      'Au revoir!'
    ],
    isActive: true,
  },
  {
    language: 'french',
    level: 'A1',
    topicId: 'lesson-02',
    topicName: 'Leçon 2',
    topicNameEn: 'Lesson 2',
    day: 1,
    title: 'Basic Numbers and Colors',
    explanation: 'Lesson 2 focuses on numbers from 1 to 20 and basic colors. These are essential vocabulary items you will use in everyday conversations.',
    exampleSentences: [
      'Un, deux, trois, quatre, cinq.',
      'Le livre est rouge.',
      'J\'ai dix ans.',
      'La maison est bleue.',
      'Vingt euros, s\'il vous plaît.',
      'Quelle est votre couleur préférée?',
      'La voiture est noire.',
      'Le ciel est bleu.'
    ],
    isActive: true,
  },
  {
    language: 'french',
    level: 'A1',
    topicId: 'lesson-03',
    topicName: 'Leçon 3',
    topicNameEn: 'Lesson 3',
    day: 1,
    title: 'Articles and Nouns',
    explanation: 'Lesson 3 introduces French articles (le, la, les) and their usage with nouns. Understanding articles is crucial for proper French grammar.',
    exampleSentences: [
      'Le chat est noir.',
      'La maison est grande.',
      'Les enfants jouent.',
      'J\'ai un livre.',
      'Elle a une voiture.',
      'Vous avez des amis.',
      'Le professeur est gentil.',
      'La fille danse bien.'
    ],
    isActive: true,
  },
  {
    language: 'french',
    level: 'A1',
    topicId: 'lesson-04',
    topicName: 'Leçon 4',
    topicNameEn: 'Lesson 4',
    day: 1,
    title: 'Present Tense Verbs',
    explanation: 'Lesson 4 teaches the present tense conjugation of common verbs like être (to be), avoir (to have), and parler (to speak). This is fundamental for forming sentences.',
    exampleSentences: [
      'Je suis étudiant.',
      'Tu es intelligent.',
      'Il est médecin.',
      'Nous sommes amis.',
      'Vous êtes professeurs.',
      'Ils sont astronautes.',
      'J\'ai un chat.',
      'Tu as une maison.'
    ],
    isActive: true,
  },
  {
    language: 'french',
    level: 'A1',
    topicId: 'lesson-05',
    topicName: 'Leçon 5',
    topicNameEn: 'Lesson 5',
    day: 1,
    title: 'Family and Relationships',
    explanation: 'Lesson 5 covers family vocabulary and ways to describe relationships. You will learn words for family members and how to talk about them.',
    exampleSentences: [
      'Mon père est ingénieur.',
      'Ma mère est avocate.',
      'Mon frère s\'appelle David.',
      'Ma sœur est étudiante.',
      'Mes grands-parents habitent en France.',
      'Tes cousins sont sympathiques.',
      'Notre famille est grande.',
      'Leurs enfants sont jeunes.'
    ],
    isActive: true,
  },
  {
    language: 'french',
    level: 'A1',
    topicId: 'lesson-06',
    topicName: 'Leçon 6',
    topicNameEn: 'Lesson 6',
    day: 1,
    title: 'Food and Drinks',
    explanation: 'Lesson 6 introduces vocabulary related to food and beverages. Learn how to order in a restaurant and discuss your favorite foods.',
    exampleSentences: [
      'Je voudrais un café, s\'il vous plaît.',
      'Le pain est délicieux.',
      'Elle aime les pommes.',
      'Nous mangeons du poisson le vendredi.',
      'Tu bois de l\'eau?',
      'Ils prennent du fromage.',
      'Le gâteau est sucré.',
      'J\'adore le chocolat.'
    ],
    isActive: true,
  },
  {
    language: 'french',
    level: 'A1',
    topicId: 'lesson-07',
    topicName: 'Leçon 7',
    topicNameEn: 'Lesson 7',
    day: 1,
    title: 'Describing Places',
    explanation: 'Lesson 7 focuses on describing locations and places. Learn how to give directions and describe what you see around you.',
    exampleSentences: [
      'La école est grande et moderne.',
      'La bibliothèque est près du parc.',
      'Le musée est au centre de la ville.',
      'La gare est loin d\'ici.',
      'À gauche, il y a une église.',
      'À droite, vous voyez l\'hôtel.',
      'Dans le jardin, il y a des fleurs.',
      'Derrière la maison, il y a un lac.'
    ],
    isActive: true,
  },
  {
    language: 'french',
    level: 'A1',
    topicId: 'lesson-08',
    topicName: 'Leçon 8',
    topicNameEn: 'Lesson 8',
    day: 1,
    title: 'Daily Activities',
    explanation: 'Lesson 8 covers everyday activities and routines. Learn how to describe what you do each day and ask others about their routines.',
    exampleSentences: [
      'Je me réveille à 7 heures.',
      'Tu te brosses les dents.',
      'Il prend le petit déjeuner.',
      'Elle va à l\'école.',
      'Nous étudions le français.',
      'Vous travaillez à l\'ordinateur.',
      'Ils jouent au football.',
      'Je regarde la télévision le soir.'
    ],
    isActive: true,
  },
  {
    language: 'french',
    level: 'A1',
    topicId: 'lesson-09',
    topicName: 'Leçon 9',
    topicNameEn: 'Lesson 9',
    day: 1,
    title: 'Sports and Hobbies',
    explanation: 'Lesson 9 introduces sports and hobby vocabulary. Discover how to talk about activities you enjoy and ask others about theirs.',
    exampleSentences: [
      'Je joue au tennis.',
      'Tu aimes le football?',
      'Il fait du yoga.',
      'Elle nage très bien.',
      'Nous aimons la musique.',
      'Vous faites du ski?',
      'Ils regardent un match de hockey.',
      'J\'adore danser.'
    ],
    isActive: true,
  },
  {
    language: 'french',
    level: 'A1',
    topicId: 'lesson-10',
    topicName: 'Leçon 10',
    topicNameEn: 'Lesson 10',
    day: 1,
    title: 'Travel and Transportation',
    explanation: 'Lesson 10, the final introductory lesson, covers travel and transportation. Learn how to book a ticket and talk about how you get around.',
    exampleSentences: [
      'Je vais à Paris en train.',
      'Tu prends l\'avion pour aller en Allemagne.',
      'Il voyage en voiture.',
      'Elle prend le bus tous les jours.',
      'Nous allons au musée à pied.',
      'Vous voyagez en bateau.',
      'Ils se déplacent à vélo.',
      'Quel est le meilleur moyen de transport?'
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

    // Insert lessons
    const result = await GrammarLesson.insertMany(lessons);
    console.log(`✅ Successfully added ${result.length} lessons!\n`);

    // Display what was added
    console.log('📚 Lessons created:\n');
    result.forEach((lesson, index) => {
      console.log(`${index + 1}. ${lesson.topicName} (${lesson.topicNameEn})`);
      console.log(`   📝 ${lesson.title}`);
      console.log();
    });

    console.log('✨ All 10 lessons are ready! You can now start learning.\n');
    console.log('Step-by-step progression:');
    console.log('  Complete Lesson 1 → Unlock Lesson 2');
    console.log('  Complete Lesson 2 → Unlock Lesson 3');
    console.log('  And so on... up to Lesson 10\n');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();
