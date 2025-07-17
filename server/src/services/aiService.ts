// AI Service for VocaFluence
// This service handles voice-to-text conversion and AI feedback generation

export interface AITranscriptResult {
    transcript: string;
    confidence: number;
}

export interface AIFeedbackResult {
    score: number;
    accuracy: number;
    fluency: number;
    feedbackComments: string[];
    wordsPerMinute?: number;
}

export class AIService {
    // Mock Whisper API for voice-to-text conversion
    static async transcribeAudio(audioBuffer: Buffer): Promise<AITranscriptResult> {
        // In a real implementation, this would call OpenAI's Whisper API
        // For MVP, we'll simulate the transcription with some randomness

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

            // Mock transcription - in reality, this would be the actual transcript
            const mockTranscripts = [
                "Hello, how are you today?",
                "The weather is beautiful outside.",
                "I love learning new languages.",
                "Practice makes perfect.",
                "Thank you for your time."
            ];

            const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
            const confidence = 0.7 + Math.random() * 0.3; // 70-100% confidence

            return {
                transcript,
                confidence
            };
        } catch (error) {
            console.error('Transcription error:', error);
            throw new Error('Failed to transcribe audio');
        }
    }

    // AI feedback generation based on script comparison
    static async generateFeedback(
        originalScript: string,
        userTranscript: string,
        duration: number
    ): Promise<AIFeedbackResult> {
        try {
            // Calculate basic metrics
            const originalWords = originalScript.toLowerCase().split(/\s+/).filter(word => word.length > 0);
            const userWords = userTranscript.toLowerCase().split(/\s+/).filter(word => word.length > 0);

            // Calculate accuracy (word match percentage)
            const matchedWords = userWords.filter(word => originalWords.includes(word)).length;
            const accuracy = Math.min(100, (matchedWords / originalWords.length) * 100);

            // Calculate words per minute
            const wordsPerMinute = Math.round((userWords.length / duration) * 60);

            // Calculate fluency score (based on word count and accuracy)
            const fluency = Math.min(100, (accuracy * 0.7) + (Math.min(100, wordsPerMinute) * 0.3));

            // Overall score (weighted average)
            const score = Math.round((accuracy * 0.6) + (fluency * 0.4));

            // Generate feedback comments (≤10 words each)
            const feedbackComments = this.generateFeedbackComments(accuracy, fluency, wordsPerMinute, originalWords.length, userWords.length);

            return {
                score,
                accuracy: Math.round(accuracy),
                fluency: Math.round(fluency),
                feedbackComments,
                wordsPerMinute
            };
        } catch (error) {
            console.error('Feedback generation error:', error);
            throw new Error('Failed to generate feedback');
        }
    }

    private static generateFeedbackComments(
        accuracy: number,
        fluency: number,
        wordsPerMinute: number,
        originalWordCount: number,
        userWordCount: number
    ): string[] {
        const comments: string[] = [];

        // Accuracy-based feedback
        if (accuracy >= 90) {
            comments.push("Excellent word accuracy!");
        } else if (accuracy >= 70) {
            comments.push("Good accuracy, keep practicing.");
        } else if (accuracy >= 50) {
            comments.push("Focus on word pronunciation.");
        } else {
            comments.push("Review the script carefully.");
        }

        // Fluency-based feedback
        if (fluency >= 85) {
            comments.push("Great speaking pace!");
        } else if (fluency >= 60) {
            comments.push("Work on speaking speed.");
        } else {
            comments.push("Practice reading aloud more.");
        }

        // Word count feedback
        const wordDifference = originalWordCount - userWordCount;
        if (wordDifference > 3) {
            comments.push(`Skipped ${wordDifference} words.`);
        } else if (wordDifference < -2) {
            comments.push("Added extra words.");
        }

        // Ensure we have exactly 3 comments
        while (comments.length < 3) {
            comments.push("Keep up the good work!");
        }

        return comments.slice(0, 3);
    }

    // Enhanced scoring algorithm
    static calculateAdvancedScore(
        originalScript: string,
        userTranscript: string,
        duration: number
    ): number {
        const originalWords = originalScript.toLowerCase().split(/\s+/).filter(word => word.length > 0);
        const userWords = userTranscript.toLowerCase().split(/\s+/).filter(word => word.length > 0);

        // Word accuracy (60% weight)
        const matchedWords = userWords.filter(word => originalWords.includes(word)).length;
        const wordAccuracy = (matchedWords / originalWords.length) * 100;

        // Timing accuracy (20% weight)
        const expectedDuration = originalWords.length * 0.5; // Assume 0.5 seconds per word
        const timingAccuracy = Math.max(0, 100 - Math.abs(duration - expectedDuration) / expectedDuration * 100);

        // Completeness (20% weight)
        const completeness = Math.min(100, (userWords.length / originalWords.length) * 100);

        const finalScore = (wordAccuracy * 0.6) + (timingAccuracy * 0.2) + (completeness * 0.2);

        return Math.round(Math.min(100, Math.max(0, finalScore)));
    }
}

export default AIService; 