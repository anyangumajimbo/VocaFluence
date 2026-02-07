const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const grammarLessonSchema = new mongoose.Schema({
  language: String,
  level: String,
  topicId: String,
  topicName: String,
  topicNameEn: String,
  day: Number,
  title: String,
  explanation: String,
  exampleSentences: [String],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
});

const GrammarLesson = mongoose.model('GrammarLesson', grammarLessonSchema);

const fixLessons = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/vocafluence';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Fix the engineers -> ingénieurs typo
    const updated = await GrammarLesson.findOneAndUpdate(
      { exampleSentences: "Ils sont engineers." },
      { 
        $set: { 
          exampleSentences: [
            "Je suis dentiste.",
            "Tu es professeur.",
            "Il est acteur.",
            "Elle est avocate.",
            "Nous sommes français(es).",
            "Vous êtes anglais(es).",
            "Ils sont ingénieurs.",
            "Elles sont allemandes."
          ]
        }
      },
      { new: true }
    );

    if (updated) {
      console.log('✅ Fixed lesson:');
      console.log('   Title:', updated.title);
      console.log('   Day:', updated.day);
      console.log('   TopicId:', updated.topicId);
    } else {
      console.log('❌ Lesson not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixLessons();
