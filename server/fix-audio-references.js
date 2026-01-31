const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vocafluence');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Define Script schema inline for this utility
const scriptSchema = new mongoose.Schema({
    title: String,
    referenceAudioURL: String,
    // ... other fields not needed for this fix
});

const Script = mongoose.model('Script', scriptSchema);

// Fix audio references
const fixAudioReferences = async () => {
    try {
        console.log('\n📋 Checking audio file references...\n');

        // Get all scripts with referenceAudioURL
        const scripts = await Script.find({ referenceAudioURL: { $exists: true, $ne: '' } });
        
        console.log(`Found ${scripts.length} scripts with reference audio URLs\n`);

        const uploadDir = path.join(__dirname, 'uploads/reference-audio');
        const existingFiles = fs.readdirSync(uploadDir);
        
        console.log(`Existing audio files in server:`, existingFiles);
        console.log('\n---\n');

        let fixedCount = 0;
        let invalidCount = 0;
        let validCount = 0;

        for (const script of scripts) {
            const audioUrl = script.referenceAudioURL;
            
            // Extract filename from URL
            const filename = audioUrl.split('/').pop();
            const filePath = path.join(uploadDir, filename);
            const fileExists = fs.existsSync(filePath);

            if (!fileExists) {
                console.log(`❌ MISSING: "${script.title}"`);
                console.log(`   URL: ${audioUrl}`);
                console.log(`   Looking for: ${filename}`);
                
                // Try to find similar file (same timestamp prefix)
                const timestampPrefix = filename.split('-').slice(0, 2).join('-');
                const similarFiles = existingFiles.filter(f => 
                    f.includes('referenceAudio') && 
                    f.startsWith(timestampPrefix)
                );
                
                if (similarFiles.length > 0) {
                    console.log(`   Similar files found: ${similarFiles.join(', ')}`);
                    // Option: Update to use the found file
                    const newUrl = `/uploads/reference-audio/${similarFiles[0]}`;
                    await Script.updateOne(
                        { _id: script._id },
                        { referenceAudioURL: newUrl }
                    );
                    console.log(`   ✅ Updated to: ${newUrl}`);
                    fixedCount++;
                } else {
                    // No similar file found, remove the reference
                    await Script.updateOne(
                        { _id: script._id },
                        { referenceAudioURL: '' }
                    );
                    console.log(`   ✅ Removed invalid reference`);
                    invalidCount++;
                }
            } else {
                console.log(`✅ OK: "${script.title}"`);
                console.log(`   File exists: ${filename}`);
                validCount++;
            }
            console.log();
        }

        console.log('\n📊 Summary:');
        console.log(`   Total scripts checked: ${scripts.length}`);
        console.log(`   Updated references: ${fixedCount}`);
        console.log(`   Removed invalid references: ${invalidCount}`);
        console.log(`   Valid references: ${validCount}`);

        console.log('\n✅ Audio reference fix complete!');

    } catch (error) {
        console.error('❌ Error fixing audio references:', error);
    }
};

// Main execution
const main = async () => {
    await connectDB();
    await fixAudioReferences();
    await mongoose.connection.close();
    console.log('\nConnection closed');
    process.exit(0);
};

main();
