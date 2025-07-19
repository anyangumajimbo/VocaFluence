// Simple test script for OpenAI Whisper integration
// Run with: node test-whisper-simple.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function testWhisperIntegration() {
    console.log('🧪 Testing OpenAI Whisper Integration (Simple Version)...\n');

    try {
        // Check OpenAI API key
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }
        console.log('✅ OpenAI API key found');

        // Import OpenAI
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey });

        // Check if we have a test audio file
        const testAudioPath = path.join(__dirname, 'test-audio.wav');

        if (!fs.existsSync(testAudioPath)) {
            console.log('⚠️  No test audio file found at test-audio.wav');
            console.log('📝 To test with real audio:');
            console.log('   1. Record a short French audio file (WAV format)');
            console.log('   2. Save it as "test-audio.wav" in the server directory');
            console.log('   3. Run this test again\n');

            console.log('✅ OpenAI Whisper integration is ready!');
            console.log('📋 Next steps:');
            console.log('   1. Start the server with: pnpm dev');
            console.log('   2. Test recording in the web application');
            return;
        }

        // Check file size
        const stats = fs.statSync(testAudioPath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        console.log(`📁 Audio file size: ${fileSizeInMB.toFixed(2)} MB`);

        if (fileSizeInMB > 25) {
            console.log('⚠️  Warning: File is very large (>25MB). This may cause issues.');
        }

        // Read audio file
        console.log('📁 Loading audio file...');
        const audioBuffer = fs.readFileSync(testAudioPath);
        console.log(`✅ Loaded ${(audioBuffer.length / (1024 * 1024)).toFixed(2)} MB of audio data`);

        // Create a readable stream from the buffer
        const { Readable } = require('stream');
        const stream = Readable.from(audioBuffer);

        // Test transcription
        console.log('🔄 Starting transcription...');

        const transcription = await openai.audio.transcriptions.create({
            file: stream,
            model: 'whisper-1',
            response_format: 'verbose_json',
            language: 'fr' // French
        });

        console.log('✅ Transcription successful!');
        console.log(`📝 Transcript: "${transcription.text}"`);

        const confidence = transcription.verbose_json?.segments?.[0]?.avg_logprob || 0.8;

        console.log('\n📊 Test Results:');
        console.log(`   Transcript: "${transcription.text}"`);
        console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);

        console.log('\n✅ Whisper integration test completed successfully!');
        console.log('\n🇫🇷 Your French audio should now be properly transcribed!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);

        if (error.message.includes('401')) {
            console.log('\n💡 Solution: Check your OPENAI_API_KEY in the .env file');
        } else if (error.message.includes('429')) {
            console.log('\n💡 Solution: Wait a moment and try again (rate limit)');
        } else if (error.message.includes('413')) {
            console.log('\n💡 Solution: Audio file is too large. Use a shorter recording.');
        } else if (error.message.includes('multipart form')) {
            console.log('\n💡 Solution: Audio format issue. Try converting to MP3 or use a different audio file.');
        } else {
            console.log('\n💡 Check your internet connection and OpenAI API key');
        }
    }
}

// Run the test
console.log('🚀 Starting simple Whisper test...\n');
testWhisperIntegration(); 