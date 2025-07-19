// Script to add sample scripts to the database
// Run with: node add-sample-scripts.js

require('dotenv').config();
const mongoose = require('mongoose');
const { Script } = require('./dist/models/Script');

const sampleScripts = [
    {
        title: "Basic French Greetings",
        textContent: "Bonjour! Comment allez-vous aujourd'hui? Je m'appelle Marie et je suis ravie de vous rencontrer. Comment vous appelez-vous?",
        language: "french",
        difficulty: "beginner",
        tags: ["greetings", "basic", "introduction"],
        isActive: true
    },
    {
        title: "French Weather Conversation",
        textContent: "Quel temps fait-il aujourd'hui? Il fait beau et ensoleillé. J'aime quand il fait chaud en été. Et vous, quel temps préférez-vous?",
        language: "french",
        difficulty: "intermediate",
        tags: ["weather", "conversation", "summer"],
        isActive: true
    },
    {
        title: "English Daily Routine",
        textContent: "Good morning! I wake up at 7 AM every day. First, I brush my teeth and take a shower. Then I have breakfast and go to work. What's your daily routine like?",
        language: "english",
        difficulty: "beginner",
        tags: ["daily routine", "morning", "basic"],
        isActive: true
    },
    {
        title: "English Job Interview",
        textContent: "Hello, I'm here for the job interview. I have five years of experience in software development. I'm passionate about creating innovative solutions and working in a team environment.",
        language: "english",
        difficulty: "intermediate",
        tags: ["job interview", "professional", "experience"],
        isActive: true
    },
    {
        title: "Swahili Basic Phrases",
        textContent: "Jambo! Habari yako? Nzuri sana, asante. Jina langu ni Amina. Unatoka wapi? Mimi natoka Tanzania.",
        language: "swahili",
        difficulty: "beginner",
        tags: ["basic phrases", "introduction", "tanzania"],
        isActive: true
    },
    {
        title: "Swahili Market Conversation",
        textContent: "Karibu! Bei ya mboga ni shilingi elfu tano. Unaweza kupunguza kidogo? Sawa, itakuwa shilingi elfu nne tu. Asante sana!",
        language: "swahili",
        difficulty: "intermediate",
        tags: ["market", "bargaining", "vegetables"],
        isActive: true
    },
    {
        title: "French Restaurant Order",
        textContent: "Bonjour monsieur! Je voudrais une table pour deux personnes, s'il vous plaît. Avez-vous une table libre? Oui, parfait. Je vais prendre le menu du jour.",
        language: "french",
        difficulty: "intermediate",
        tags: ["restaurant", "ordering", "menu"],
        isActive: true
    },
    {
        title: "English Travel Planning",
        textContent: "I'm planning a trip to Europe next summer. I want to visit Paris, Rome, and Barcelona. Do you have any recommendations for places to stay? I'm looking for affordable but comfortable accommodations.",
        language: "english",
        difficulty: "advanced",
        tags: ["travel", "planning", "europe"],
        isActive: true
    }
];

async function addSampleScripts() {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error("MONGO_URI is not defined in the environment variables");
        }

        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');

        // Clear existing scripts (optional - comment out if you want to keep existing ones)
        // await Script.deleteMany({});
        // console.log('🗑️  Cleared existing scripts');

        // Check if scripts already exist
        const existingCount = await Script.countDocuments();
        if (existingCount > 0) {
            console.log(`📊 Found ${existingCount} existing scripts`);
            console.log('💡 Skipping sample script creation (scripts already exist)');
            console.log('💡 To add sample scripts, first clear the database or delete existing scripts');
            return;
        }

        // Add sample scripts
        console.log('📝 Adding sample scripts...');

        for (const scriptData of sampleScripts) {
            const script = new Script({
                ...scriptData,
                uploadedBy: new mongoose.Types.ObjectId() // Mock user ID
            });
            await script.save();
            console.log(`✅ Added: ${scriptData.title} (${scriptData.language})`);
        }

        console.log('\n🎉 Sample scripts added successfully!');
        console.log(`📊 Total scripts in database: ${await Script.countDocuments()}`);

        // Show summary
        const summary = await Script.aggregate([
            {
                $group: {
                    _id: '$language',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n📈 Scripts by language:');
        summary.forEach(item => {
            console.log(`   ${item._id}: ${item.count} scripts`);
        });

    } catch (error) {
        console.error('❌ Error adding sample scripts:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
addSampleScripts(); 