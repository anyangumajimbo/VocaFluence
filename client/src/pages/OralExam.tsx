import React, { useState, useRef } from 'react';
import { api } from '../services/api';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface Evaluation {
    commentaireGlobal?: string;
}

interface AudioConfig {
    mimeType: string;
    requiresConversion: boolean;
    platform: string;
}

const OralExam: React.FC = () => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [question, setQuestion] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [transcript, setTranscript] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPlayingStudentAudio, setIsPlayingStudentAudio] = useState(false);
    const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);

    // Platform and audio format detection
    const detectAudioCapabilities = (): AudioConfig => {
        const userAgent = navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);

        // Check WebM support
        const webmSupported = MediaRecorder.isTypeSupported('audio/webm;codecs=opus');

        let mimeType: string;
        let requiresConversion: boolean;
        let platform: string;

        if (webmSupported && !isIOS) {
            // Method A: Efficient WebM recording
            mimeType = 'audio/webm;codecs=opus';
            requiresConversion = false;
            platform = isAndroid ? 'android' : 'desktop';
        } else {
            // Method B: Fallback with conversion
            if (isIOS) {
                mimeType = 'audio/mp4';
            } else if (isAndroid) {
                mimeType = 'audio/webm';
            } else {
                mimeType = 'audio/wav';
            }
            requiresConversion = true;
            platform = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
        }

        return { mimeType, requiresConversion, platform };
    };

    const startSession = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/oral-exam/session');
            const data = res.data;
            setSessionId(data.sessionId);
            setQuestion(data.question);
            setMessages([
                { role: 'system', content: 'Examen DELF B2 - Session commencée.' },
                { role: 'assistant', content: data.aiMessage }
            ]);
            setEvaluation(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    const playAudio = async (text: string) => {
        try {
            setIsPlaying(true);
            const res = await api.post('/oral-exam/tts', { text });
            const audioBlob = new Blob([res.data], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                setIsPlaying(false);
            };

            audio.onerror = () => {
                setIsPlaying(false);
                alert('Erreur lors de la lecture audio.');
            };

            await audio.play();
        } catch (err) {
            setIsPlaying(false);
            alert('Erreur lors de la lecture audio.');
        }
    };

    const togglePlayPause = async () => {
        const currentMessage = getCurrentExaminerMessage();
        if (currentMessage) {
            if (isPlaying) {
                setIsPlaying(false);
                // Note: HTML5 Audio doesn't have a pause() method, so we'll just stop
            } else {
                await playAudio(currentMessage);
            }
        }
    };

    const startRecording = async () => {
        setTranscript(null);
        setError(null);

        // Detect audio capabilities
        const config = detectAudioCapabilities();

        setRecording(true);
        audioChunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Use detected MIME type
            const recorder = new MediaRecorder(stream, {
                mimeType: config.mimeType,
                audioBitsPerSecond: 128000
            });

            setMediaRecorder(recorder);

            recorder.ondataavailable = (e) => {
                audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: config.mimeType });
                await transcribeAudio(audioBlob, config);
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
        } catch (err) {
            setError('Microphone access denied or unavailable. Please check your browser and device settings to allow microphone access.');
            setRecording(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            setRecording(false);
        }
    };

    const transcribeAudio = async (audioBlob: Blob, config: AudioConfig) => {
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();

            // Set appropriate filename based on format
            let filename = 'recording';
            if (config.mimeType.includes('webm')) {
                filename += '.webm';
            } else if (config.mimeType.includes('mp4')) {
                filename += '.m4a';
            } else {
                filename += '.wav';
            }

            formData.append('audio', audioBlob, filename);
            formData.append('requiresConversion', config.requiresConversion.toString());
            formData.append('platform', config.platform);

            const res = await api.post('/oral-exam/transcribe', formData);
            const data = res.data;
            setTranscript(data.transcript);
            setCurrentAudioBlob(audioBlob); // Store the audio blob for playback
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const playStudentAudio = () => {
        if (!currentAudioBlob) return;

        setIsPlayingStudentAudio(true);
        const audioUrl = URL.createObjectURL(currentAudioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
            setIsPlayingStudentAudio(false);
        };

        audio.onerror = () => {
            setIsPlayingStudentAudio(false);
            alert('Erreur lors de la lecture audio.');
        };

        audio.play().catch(() => {
            setIsPlayingStudentAudio(false);
            alert('Erreur lors de la lecture audio.');
        });
    };

    const reRecord = () => {
        setTranscript(null);
        setCurrentAudioBlob(null);
        setIsPlayingStudentAudio(false);
    };

    const sendTranscript = async () => {
        if (!transcript || !sessionId) return;
        setTranscript(null);
        await sendMessageWithText(transcript);
    };

    const sendMessageWithText = async (text: string) => {
        setLoading(true);
        setError(null);
        try {
            const userMsg: Message = { role: 'user', content: text };
            setMessages(prev => [...prev, userMsg]);
            const res = await api.post(`/oral-exam/session/${sessionId}/message`, {
                userMessage: text
            });
            const data = res.data;
            setMessages(prev => [...prev, { role: 'assistant', content: data.aiMessage }]);
            if (/Cohérence|Richesse du vocabulaire|Correction grammaticale|Prononciation|points forts|axes d'amélioration|commentaire global/i.test(data.aiMessage)) {
                setEvaluation({ commentaireGlobal: data.aiMessage });
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Get current examiner message (latest assistant message)
    const getCurrentExaminerMessage = () => {
        const assistantMessages = messages.filter(msg => msg.role === 'assistant');
        return assistantMessages[assistantMessages.length - 1]?.content || '';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="text-center">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">DELF B2 ORAL EXAM</h1>
                        {question && (
                            <div className="mt-2">
                                <span className="font-semibold text-gray-700">SUJET:</span>
                                <span className="ml-2 italic text-gray-600">{question}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {!sessionId ? (
                    <div className="text-center">
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                            onClick={startSession}
                            disabled={loading}
                        >
                            {loading ? 'Starting...' : 'Start New Exam'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Examiner's Box */}
                        <div className="bg-white rounded-lg shadow-md border border-gray-200">
                            <div className="px-4 py-3 bg-green-50 border-b border-green-200 rounded-t-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-green-800">EXAMINATEUR</h3>
                                        <p className="text-xs text-green-600 mt-1">Message actuel de l'examinateur</p>
                                    </div>
                                    {getCurrentExaminerMessage() && (
                                        <button
                                            onClick={togglePlayPause}
                                            className="flex-shrink-0 w-12 h-12 rounded-full bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transform hover:scale-105 active:scale-95"
                                            title={isPlaying ? 'Pause' : 'Play'}
                                        >
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <span className={`text-lg transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
                                                    ▶
                                                </span>
                                                <span className={`text-lg absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                                                    ⏸
                                                </span>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 min-h-[60px]">
                                {getCurrentExaminerMessage() ? (
                                    <div>
                                        <p className="text-gray-800 leading-relaxed">{getCurrentExaminerMessage()}</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No examiner message yet</p>
                                )}
                            </div>
                        </div>

                        {/* Transcription Box */}
                        <div className="bg-white rounded-lg shadow-md border border-gray-200">
                            <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 rounded-t-lg">
                                <h3 className="font-semibold text-blue-800">CANDIDAT</h3>
                                <p className="text-xs text-blue-600 mt-1">Transcription de la parole actuelle du candidat</p>
                            </div>
                            <div className="p-4 min-h-[120px]">
                                {transcript ? (
                                    <div className="space-y-3">
                                        <div className="bg-blue-50 p-3 rounded border">
                                            <p className="text-gray-800 italic leading-relaxed">{transcript}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                                                onClick={sendTranscript}
                                                disabled={loading}
                                            >
                                                SEND
                                            </button>
                                            <button
                                                className="flex-shrink-0 w-12 h-12 rounded-full bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transform hover:scale-105 active:scale-95"
                                                onClick={playStudentAudio}
                                                title={isPlayingStudentAudio ? 'Pause' : 'Play Recording'}
                                                disabled={isPlayingStudentAudio}
                                            >
                                                <div className="relative w-full h-full flex items-center justify-center">
                                                    <span className={`text-lg transition-opacity duration-300 ${isPlayingStudentAudio ? 'opacity-0' : 'opacity-100'}`}>
                                                        ▶
                                                    </span>
                                                    <span className={`text-lg absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isPlayingStudentAudio ? 'opacity-100' : 'opacity-0'}`}>
                                                        ⏸
                                                    </span>
                                                </div>
                                            </button>
                                            <button
                                                className="flex-shrink-0 w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                                                onClick={reRecord}
                                                title="Re-record"
                                            >
                                                <span className="text-2xl">🎤</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-center">
                                            <button
                                                className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${recording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400`}
                                                onClick={recording ? stopRecording : startRecording}
                                                disabled={loading}
                                                title={recording ? 'Stop Recording' : 'Start Recording'}
                                            >
                                                {recording ? <span className="text-2xl">■</span> : <span className="text-2xl">🎤</span>}
                                            </button>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-gray-600 text-sm">
                                                {recording ? 'Recording... Click to stop' : 'Click microphone to start recording'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                onClick={() => setShowHistory(!showHistory)}
                            >
                                {showHistory ? 'HIDE HISTORY' : 'SHOW HISTORY'}
                            </button>
                        </div>

                        {/* History Section */}
                        {showHistory && (
                            <div className="bg-white rounded-lg shadow-md border border-gray-200">
                                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                                    <h3 className="font-semibold text-gray-800">Conversation History</h3>
                                    <p className="text-xs text-gray-600 mt-1">Scroll to view the full conversation with the examiner</p>
                                </div>
                                <div className="p-4 max-h-96 overflow-y-auto">
                                    {messages.length > 0 ? (
                                        <div className="space-y-3">
                                            {messages.map((msg, idx) => (
                                                <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-50 ml-8' : 'bg-green-50 mr-8'}`}>
                                                    <div className={`font-semibold text-sm mb-1 ${msg.role === 'user' ? 'text-blue-700' : 'text-green-700'}`}>
                                                        {msg.role === 'user' ? 'You' : 'Examiner'}:
                                                    </div>
                                                    <div className="text-gray-800">{msg.content}</div>
                                                    {msg.role === 'assistant' && (
                                                        <button
                                                            className="mt-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                            onClick={() => playAudio(msg.content)}
                                                            title="Écouter"
                                                        >
                                                            <span className="text-xs">▶️</span>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic text-center">No conversation history yet</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Evaluation */}
                        {evaluation && (
                            <div className="bg-white rounded-lg shadow-md border border-gray-200">
                                <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200 rounded-t-lg">
                                    <h3 className="font-semibold text-yellow-800">Final Evaluation</h3>
                                </div>
                                <div className="p-4">
                                    <div className="text-gray-800">{evaluation.commentaireGlobal}</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-red-800">{error}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OralExam; 