// Test script for OpenAI Whisper integration with increased memory
// Run with: node --max-old-space-size=4096 test-whisper-memory.js

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

            const transcription = await openai.audio.transcriptions.create({
                file: audioBuffer,
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
    }
};

async function testWhisperIntegration() {
    console.log('🧪 Testing OpenAI Whisper Integration with French Audio (High Memory Mode)...\n');

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
            return;
        }

        // Check file size before loading
        const stats = fs.statSync(testAudioPath);
        const fileSizeInMB = stats.size / (1024 * 1024);

        console.log(`📁 Audio file size: ${fileSizeInMB.toFixed(2)} MB`);

        if (fileSizeInMB > 25) {
            console.log('⚠️  Large file detected. Using high memory mode...');
        }

        // Read the test audio file
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
            console.log('\n💡 Solution: Try running with more memory: node --max-old-space-size=8192 test-whisper-memory.js');
        } else {
            console.log('\n💡 Check your internet connection and OpenAI API key');
        }
    }
}

// Run the test
console.log('🚀 Starting test with high memory allocation...\n');
testWhisperIntegration(); 