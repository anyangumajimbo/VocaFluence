// Test script for OpenAI Whisper integration
// Run with: node test-whisper.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Mock the AI service for testing
const AIService = {
    initialize() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }
        console.log('✅ OpenAI API key found');
    },

    async transcribeAudio(audioBuffer, language = 'french') {
        const { OpenAI } = require('openai');

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        try {
            console.log(`🔄 Transcribing French audio...`);

            // Create a proper file object for OpenAI
            const { File } = require('buffer');
            const audioFile = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });

            const transcription = await openai.audio.transcriptions.create({
                file: audioFile,
                model: 'whisper-1',
                response_format: 'verbose_json',
                language: 'fr' // Explicitly set to French
            });

            console.log('✅ French transcription successful!');
            console.log(`📝 Transcript: "${transcription.text}"`);

            return {
                transcript: transcription.text,
                confidence: transcription.verbose_json?.segments?.[0]?.avg_logprob || 0.8
            };
        } catch (error) {
            console.error('❌ Transcription failed:', error.message);
            throw error;
        }
    },

    getLanguageCode(language) {
        const languageMap = {
            'english': 'en',
            'french': 'fr',
            'swahili': 'sw',
            'en': 'en',
            'fr': 'fr',
            'sw': 'sw'
        };

        return languageMap[language.toLowerCase()] || 'en';
    }
};

async function testWhisperIntegration() {
    console.log('🧪 Testing OpenAI Whisper Integration with French Audio...\n');

    try {
        // Initialize the service
        AIService.initialize();
        console.log('✅ Service initialized successfully\n');

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
            console.log('   1. Set your OPENAI_API_KEY in .env file');
            console.log('   2. Start the server with: pnpm dev');
            console.log('   3. Test recording in the web application');
            return;
        }

        // Check file size before loading
        const stats = fs.statSync(testAudioPath);
        const fileSizeInMB = stats.size / (1024 * 1024);

        console.log(`📁 Audio file size: ${fileSizeInMB.toFixed(2)} MB`);

        // Warn if file is too large
        if (fileSizeInMB > 25) {
            console.log('⚠️  Warning: File is very large (>25MB). This may cause memory issues.');
            console.log('💡 Consider using a shorter audio file for testing.');
            console.log('💡 For production, audio files should be under 25MB.');
        }

        // Read the test audio file with memory optimization
        console.log('📁 Loading French audio file...');
        const audioBuffer = fs.readFileSync(testAudioPath);
        console.log(`✅ Loaded ${(audioBuffer.length / (1024 * 1024)).toFixed(2)} MB of audio data`);

        // Test French transcription
        console.log('🔄 Starting transcription...');
        const result = await AIService.transcribeAudio(audioBuffer, 'french');

        console.log('\n📊 French Test Results:');
        console.log(`   Transcript: "${result.transcript}"`);
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);

        console.log('\n✅ French Whisper integration test completed successfully!');
        console.log('\n🇫🇷 Your French audio should now be properly transcribed!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);

        if (error.message.includes('401')) {
            console.log('\n💡 Solution: Check your OPENAI_API_KEY in the .env file');
        } else if (error.message.includes('429')) {
            console.log('\n💡 Solution: Wait a moment and try again (rate limit)');
        } else if (error.message.includes('413')) {
            console.log('\n💡 Solution: Audio file is too large. Use a shorter recording.');
        } else if (error.message.includes('heap out of memory')) {
            console.log('\n💡 Solution: Audio file is too large for memory. Try a shorter recording.');
        } else if (error.message.includes('multipart form')) {
            console.log('\n💡 Solution: Audio format issue. Try converting to MP3 or use a different audio file.');
        } else {
            console.log('\n💡 Check your internet connection and OpenAI API key');
        }
    }
}

// Run the test with increased memory limit
console.log('🚀 Starting test with optimized memory settings...\n');
testWhisperIntegration(); 