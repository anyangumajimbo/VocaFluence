const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  topicId: String,
  day: Number,
  title: String,
  language: String,
  level: String
});

const GrammarLesson = mongoose.model('GrammarLesson', lessonSchema);

mongoose.connect('mongodb://localhost:27017/vocafluence').then(async () => {
  console.log('✅ Connected to MongoDB\n');

  // Check Topic 1
  const topic1 = await GrammarLesson.find({topicId: 'a1-01'});
  console.log('Topic a1-01 (Pronoms personnels): ' + topic1.length + ' lessons');
  topic1.forEach(l => console.log('  - Day ' + l.day + ': ' + l.title));

  // Check Topic 2
  const topic2 = await GrammarLesson.find({topicId: 'a1-02'});
  console.log('\nTopic a1-02 (Le verbe être): ' + topic2.length + ' lessons');
  topic2.forEach(l => console.log('  - Day ' + l.day + ': ' + l.title));

  // Check all A1 topics
  const allA1 = await GrammarLesson.find({level: 'A1'});
  console.log('\nTotal A1 lessons in database: ' + allA1.length);

  const topicIds = [...new Set(allA1.map(l => l.topicId))];
  console.log('Unique A1 topics: ' + topicIds.join(', '));

  mongoose.connection.close();
  process.exit(0);
}).catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
