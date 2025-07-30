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
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [transcript, setTranscript] = useState<string | null>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const [audioConfig, setAudioConfig] = useState<AudioConfig | null>(null);

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

    const sendMessage = async () => {
        if (!input.trim() || !sessionId) return;
        setLoading(true);
        setError(null);
        try {
            const userMsg: Message = { role: 'user', content: input };
            setMessages(prev => [...prev, userMsg]);
            setInput('');
            const res = await api.post(`/oral-exam/session/${sessionId}/message`, {
                userMessage: input
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

    const playAudio = async (text: string) => {
        try {
            const res = await api.post('/oral-exam/tts', { text });
            const audioBlob = new Blob([res.data], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
        } catch (err) {
            alert('Erreur lors de la lecture audio.');
        }
    };

    const startRecording = async () => {
        setTranscript(null);
        setError(null);

        // Detect audio capabilities
        const config = detectAudioCapabilities();
        setAudioConfig(config);

        console.log('Audio Config:', config);

        setRecording(true);
        audioChunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Use detected MIME type
            const recorder = new MediaRecorder(stream, {
                mimeType: config.mimeType,
                audioBitsPerSecond: 128000
            });

            console.log('Recording with MIME type:', recorder.mimeType);
            console.log('Platform:', config.platform);
            console.log('Requires conversion:', config.requiresConversion);

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

            console.log('Uploading audio with config:', {
                mimeType: config.mimeType,
                requiresConversion: config.requiresConversion,
                platform: config.platform,
                filename: filename
            });

            const res = await api.post('/oral-exam/transcribe', formData);
            const data = res.data;
            setTranscript(data.transcript);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const sendTranscript = async () => {
        if (!transcript || !sessionId) return;
        setInput(transcript);
        setTranscript(null);
        await sendMessageWithText(transcript);
    };

    const sendMessageWithText = async (text: string) => {
        setLoading(true);
        setError(null);
        try {
            const userMsg: Message = { role: 'user', content: text };
            setMessages(prev => [...prev, userMsg]);
            setInput('');
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

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-2">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">DELF B2 Oral Exam Simulator</h1>

            {/* Audio Config Display */}
            {audioConfig && (
                <div className="mb-4 p-2 bg-blue-100 rounded text-sm">
                    <div>Platform: {audioConfig.platform}</div>
                    <div>Format: {audioConfig.mimeType}</div>
                    <div>Conversion: {audioConfig.requiresConversion ? 'Required' : 'Not Required'}</div>
                </div>
            )}

            {!sessionId ? (
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 mb-8"
                    onClick={startSession}
                    disabled={loading}
                >
                    {loading ? 'Starting...' : 'Start New Exam'}
                </button>
            ) : (
                <>
                    <div className="mb-4 text-center">
                        <div className="font-semibold">Sujet :</div>
                        <div className="italic">{question}</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded mb-4 h-64 overflow-y-auto w-full max-w-2xl">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                                <span className={msg.role === 'user' ? 'font-semibold text-blue-700' : 'font-semibold text-green-700'}>
                                    {msg.role === 'user' ? 'Vous' : 'Examinateur'}:
                                </span> {msg.content}
                                {msg.role === 'assistant' && (
                                    <button
                                        className="inline-flex items-center justify-center ml-2 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        onClick={() => playAudio(msg.content)}
                                        title="Écouter la réponse de l'examinateur"
                                    >
                                        <span className="sr-only">Écouter</span>
                                        ▶️
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {!evaluation && (
                        <div className="flex gap-2 items-center mb-2 w-full max-w-2xl justify-center">
                            <button
                                className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${recording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400`}
                                onClick={recording ? stopRecording : startRecording}
                                disabled={loading}
                                title={recording ? 'Stop Recording' : 'Start Recording'}
                            >
                                {recording ? <span className="text-xl">■</span> : <span className="text-xl">🎤</span>}
                            </button>
                            <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: 'none' }} />
                            <input
                                className="flex-1 border px-2 py-1 rounded"
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                disabled={loading}
                                placeholder="Votre réponse..."
                            />
                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                onClick={sendMessage}
                                disabled={loading}
                            >
                                Envoyer
                            </button>
                        </div>
                    )}
                    {transcript && !evaluation && (
                        <div className="mb-2 p-2 bg-yellow-100 rounded">
                            <div className="mb-1">Transcription :</div>
                            <div className="italic">{transcript}</div>
                            <button
                                className="mt-2 bg-blue-600 text-white px-3 py-1 rounded"
                                onClick={sendTranscript}
                                disabled={loading}
                            >
                                Envoyer la transcription
                            </button>
                        </div>
                    )}
                    {evaluation && (
                        <div className="mt-4 p-3 bg-green-100 rounded">
                            <div className="font-bold mb-2">Évaluation finale :</div>
                            <div>{evaluation.commentaireGlobal}</div>
                        </div>
                    )}
                </>
            )}
            {error && <div className="text-red-600 mt-4">{error}</div>}
        </div>
    );
};

export default OralExam; 