import React, { useState, useRef } from 'react';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface Evaluation {
    commentaireGlobal?: string;
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
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    const [transcript, setTranscript] = useState<string | null>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    // Helper: get auth token from localStorage (adjust if you use context)
    const getToken = () => localStorage.getItem('token');

    const startSession = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/oral-exam/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                }
            });
            if (!res.ok) throw new Error('Failed to start session');
            const data = await res.json();
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
            const res = await fetch(`/api/oral-exam/session/${sessionId}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ userMessage: input })
            });
            if (!res.ok) throw new Error('Failed to send message');
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.aiMessage }]);
            // Simple check for evaluation (could be improved)
            if (/Cohérence|Richesse du vocabulaire|Correction grammaticale|Prononciation|points forts|axes d'amélioration|commentaire global/i.test(data.aiMessage)) {
                setEvaluation({ commentaireGlobal: data.aiMessage });
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Play AI message as audio using backend TTS
    const playAudio = async (text: string) => {
        try {
            const res = await fetch('/api/oral-exam/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ text })
            });
            if (!res.ok) throw new Error('Failed to fetch audio');
            const audioBlob = await res.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
        } catch (err) {
            alert('Erreur lors de la lecture audio.');
        }
    };

    // Start recording
    const startRecording = async () => {
        setTranscript(null);
        setAudioChunks([]);
        setRecording(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);
            recorder.ondataavailable = (e) => {
                setAudioChunks((prev) => [...prev, e.data]);
            };
            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                await transcribeAudio(audioBlob);
                setAudioChunks([]);
            };
            recorder.start();
        } catch (err) {
            setError('Microphone access denied or unavailable.');
            setRecording(false);
        }
    };

    // Stop recording
    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            setRecording(false);
        }
    };

    // Upload audio and get transcript
    const transcribeAudio = async (audioBlob: Blob) => {
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            const res = await fetch('/api/oral-exam/transcribe', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                },
                body: formData
            });
            if (!res.ok) throw new Error('Transcription failed');
            const data = await res.json();
            setTranscript(data.transcript);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Send transcript as user message
    const sendTranscript = async () => {
        if (!transcript || !sessionId) return;
        setInput(transcript);
        setTranscript(null);
        await sendMessageWithText(transcript);
    };

    // Helper to send a specific text as user message
    const sendMessageWithText = async (text: string) => {
        setLoading(true);
        setError(null);
        try {
            const userMsg: Message = { role: 'user', content: text };
            setMessages(prev => [...prev, userMsg]);
            setInput('');
            const res = await fetch(`/api/oral-exam/session/${sessionId}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ userMessage: text })
            });
            if (!res.ok) throw new Error('Failed to send message');
            const data = await res.json();
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
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">DELF B2 Oral Exam Simulator</h1>
            {!sessionId ? (
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                    onClick={startSession}
                    disabled={loading}
                >
                    {loading ? 'Starting...' : 'Start New Exam'}
                </button>
            ) : (
                <>
                    <div className="mb-4">
                        <div className="font-semibold">Sujet :</div>
                        <div className="italic">{question}</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded mb-4 h-64 overflow-y-auto">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                                <span className={msg.role === 'user' ? 'font-semibold text-blue-700' : 'font-semibold text-green-700'}>
                                    {msg.role === 'user' ? 'Vous' : 'Examinateur'}:
                                </span> {msg.content}
                                {msg.role === 'assistant' && (
                                    <button
                                        className="ml-2 text-blue-600 underline text-xs"
                                        onClick={() => playAudio(msg.content)}
                                    >
                                        ▶️ Écouter
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {!evaluation && (
                        <div className="flex gap-2 items-center mb-2">
                            <button
                                className={`bg-${recording ? 'red' : 'green'}-600 text-white px-4 py-1 rounded`}
                                onClick={recording ? stopRecording : startRecording}
                                disabled={loading}
                            >
                                {recording ? 'Stop' : '🎤 Record'}
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
                                className="bg-blue-600 text-white px-4 py-1 rounded"
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