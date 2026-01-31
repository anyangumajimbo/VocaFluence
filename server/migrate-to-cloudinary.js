require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Script model
const scriptSchema = new mongoose.Schema({
    title: String,
    textContent: String,
    language: String,
    difficulty: String,
    referenceAudioURL: String,
    uploadedBy: mongoose.Schema.Types.ObjectId,
    tags: [String],
    createdAt: Date,
    updatedAt: Date
});

const Script = mongoose.model('Script', scriptSchema);

async function migrateAudioFiles() {
    try {
        console.log('🚀 Starting migration to Cloudinary...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all scripts with reference audio
        const scripts = await Script.find({ 
            referenceAudioURL: { $exists: true, $ne: null, $ne: '' }
        });

        console.log(`📁 Found ${scripts.length} scripts with audio\n`);

        let successCount = 0;
        let skipCount = 0;
        let failCount = 0;

        for (const script of scripts) {
            const audioURL = script.referenceAudioURL;
            
            // Skip if already a Cloudinary URL
            if (audioURL.startsWith('http://') || audioURL.startsWith('https://')) {
                console.log(`⏭️  Skipping "${script.title}" - Already using external URL`);
                skipCount++;
                continue;
            }

            // Construct file path
            const filePath = path.join(__dirname, audioURL);
            
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                console.log(`❌ File not found for "${script.title}": ${filePath}`);
                failCount++;
                continue;
            }

            try {
                // Upload to Cloudinary
                console.log(`📤 Uploading "${script.title}"...`);
                const result = await cloudinary.uploader.upload(filePath, {
                    resource_type: 'video',
                    folder: 'vocafluence/reference-audio',
                    public_id: `ref-audio-${script._id}`,
                    format: path.extname(filePath).substring(1) || 'mp3'
                });

                // Update script with new URL
                script.referenceAudioURL = result.secure_url;
                await script.save();

                console.log(`✅ Migrated "${script.title}"`);
                console.log(`   Old: ${audioURL}`);
                console.log(`   New: ${result.secure_url}\n`);
                successCount++;
            } catch (uploadError) {
                console.error(`❌ Failed to upload "${script.title}":`, uploadError.message);
                failCount++;
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   ✅ Successfully migrated: ${successCount}`);
        console.log(`   ⏭️  Skipped (already migrated): ${skipCount}`);
        console.log(`   ❌ Failed: ${failCount}`);
        console.log(`   📁 Total: ${scripts.length}`);

        await mongoose.connection.close();
        console.log('\n✅ Migration complete!');
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

migrateAudioFiles();
