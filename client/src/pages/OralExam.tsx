import React, { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { ORAL_TOPICS, type OralTopic } from '../data/oralTopics';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface Evaluation {
    // Structure criteria (0-5 points each)
    introduction?: number; // Thème, idées principales, problématique, plan
    developpement?: number; // Arguments avec exemples, connecteurs logiques
    conclusion?: number; // Résumé, opinion, ouverture

    // Language criteria (0-5 points each)
    coherence?: number; // Structure et cohérence globale
    vocabulaire?: number; // Richesse du vocabulaire
    grammaire?: number; // Correction grammaticale
    prononciation?: number; // Prononciation claire
    connecteurs?: number; // Utilisation des connecteurs logiques
    structure?: number; // Respect de la structure I/D/C

    // Total score
    totalScore?: number; // Total sur 35 points

    // Feedback
    pointsForts?: string[];
    axesAmelioration?: string[];
    commentaireGlobal?: string;

    // Detailed feedback
    feedbackIntroduction?: string;
    feedbackDeveloppement?: string;
    feedbackConclusion?: string;
    feedbackLangue?: string;
}

interface AudioConfig {
    mimeType: string;
    requiresConversion: boolean;
    platform: string;
}

type ExamPhase = 'idle' | 'selection' | 'preparation' | 'exam' | 'results';

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
    const [showHistory, setShowHistory] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const examinerAudioRef = useRef<HTMLAudioElement | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const lastPlayedAssistantIndexRef = useRef<number>(-1);

    // New flow state
    const [phase, setPhase] = useState<ExamPhase>('idle');
    const [displayedCards, setDisplayedCards] = useState<OralTopic[]>([]);
    const [selectedCard, setSelectedCard] = useState<OralTopic | null>(null);
    const [prepSecondsLeft, setPrepSecondsLeft] = useState<number>(0);
    const [examSecondsLeft, setExamSecondsLeft] = useState<number>(0);
    const prepTimerRef = useRef<number | null>(null);
    const examTimerRef = useRef<number | null>(null);
    const [cardFontScale, setCardFontScale] = useState<number>(2); // 1..5

    const scaleToTextClass: Record<number, string> = {
        1: 'text-base',
        2: 'text-lg',
        3: 'text-xl',
        4: 'text-2xl',
        5: 'text-3xl',
    };

    const increaseFont = () => setCardFontScale((s) => Math.min(5, s + 1));
    const decreaseFont = () => setCardFontScale((s) => Math.max(1, s - 1));

    const renderParagraphs = (text: string, paragraphClass: string) => {
        const blocks = text
            .replace(/\r/g, '')
            .split(/\n{2,}/)
            .map((b) => b.trim())
            .filter(Boolean);
        const paras = blocks.length > 0 ? blocks : [text];
        return paras.map((p, idx) => (
            <p key={idx} className={paragraphClass}>
                {p.replace(/\n+/g, ' ')}
            </p>
        ));
    };

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

    const beginExamSession = async (topic?: OralTopic | null) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/oral-exam/session', topic ? {
                questionTitle: topic.title,
                questionText: topic.text,
                source: topic.source,
                topicId: topic.id,
            } : {});
            const data = res.data;
            setSessionId(data.sessionId);
            setQuestion(data.question ?? topic?.title ?? null);
            // Force the opener from examiner as requested
            setMessages([
                { role: 'system', content: 'Examen DELF B2 - Session commencée.' },
                { role: 'assistant', content: 'Vous pouvez commencer.' },
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
            // Request binary audio from server
            const res = await api.post('/oral-exam/tts', { text }, { responseType: 'arraybuffer' });
            const audioBlob = new Blob([res.data], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);

            // Stop and cleanup any existing audio
            if (examinerAudioRef.current) {
                try { examinerAudioRef.current.pause(); } catch { }
                URL.revokeObjectURL(examinerAudioRef.current.src);
                examinerAudioRef.current = null;
            }

            const audio = new Audio(audioUrl);
            examinerAudioRef.current = audio;

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


    // ---------- Flow helpers ----------
    const handleStartExamClick = () => {
        // Move to selection phase and show 2 random cards
        const shuffled = [...ORAL_TOPICS].sort(() => Math.random() - 0.5);
        setDisplayedCards(shuffled.slice(0, 2));
        setSelectedCard(null);
        setPhase('selection');
        setEvaluation(null);
        setMessages([]);
        setSessionId(null);
        setQuestion(null);
    };

    const handleSelectCard = (topic: OralTopic) => {
        setSelectedCard(topic);
        setDisplayedCards([topic]); // other disappears
        startPreparationPhase();
    };

    const startPreparationPhase = () => {
        setPhase('preparation');
        setPrepSecondsLeft(30 * 60);
        if (prepTimerRef.current) window.clearInterval(prepTimerRef.current);
        prepTimerRef.current = window.setInterval(() => {
            setPrepSecondsLeft((prev) => {
                if (prev <= 1) {
                    if (prepTimerRef.current) window.clearInterval(prepTimerRef.current);
                    proceedToExam();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const proceedToExam = () => {
        if (prepTimerRef.current) {
            window.clearInterval(prepTimerRef.current);
            prepTimerRef.current = null;
        }
        setPhase('exam');
        setExamSecondsLeft(20 * 60);
        if (examTimerRef.current) window.clearInterval(examTimerRef.current);
        examTimerRef.current = window.setInterval(() => {
            setExamSecondsLeft((prev) => {
                if (prev <= 1) {
                    if (examTimerRef.current) window.clearInterval(examTimerRef.current);
                    endExam();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        // Begin backend session bound to the selected card
        beginExamSession(selectedCard);
    };

    const endExam = () => {
        // Stop recording if any
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            try { mediaRecorder.stop(); } catch { }
        }
        setRecording(false);
        setPhase('results');
    };

    const requestFinalEvaluation = async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            await sendMessageWithText("Merci. Veuillez fournir l'évaluation finale complète (notes, points forts, axes d'amélioration, commentaire global)." );
        } finally {
            setLoading(false);
        }
    };

    const handleEndExamClick = async () => {
        // Stop recording if any
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            try { mediaRecorder.stop(); } catch { }
        }
        setRecording(false);
        await requestFinalEvaluation();
        setPhase('results');
    };

    useEffect(() => {
        return () => {
            if (prepTimerRef.current) window.clearInterval(prepTimerRef.current);
            if (examTimerRef.current) window.clearInterval(examTimerRef.current);
        };
    }, []);

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const startRecording = async () => {
        setError(null);

        // Detect audio capabilities
        const config = detectAudioCapabilities();

        setRecording(true);
        audioChunksRef.current = [];

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('getUserMedia not supported in this browser');
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Use detected MIME type
            let recorder: MediaRecorder;
            try {
                recorder = new MediaRecorder(stream, {
                    mimeType: config.mimeType,
                    audioBitsPerSecond: 128000,
                });
            } catch {
                // Fallback to default constructor if mimeType unsupported
                recorder = new MediaRecorder(stream);
            }

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
            setError('Microphone access denied or unavailable. Please ensure you granted permission and are using a supported browser (HTTPS required in production).');
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
        setIsTranscribing(true);
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
            if (data?.transcript) {
                await sendMessageWithText(data.transcript);
            }
        } catch (err: any) {
            const serverMsg = err?.response?.data?.error || err.message || 'Transcription failed';
            setError(serverMsg);
        } finally {
            setLoading(false);
            setIsTranscribing(false);
        }
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
            if (/Cohérence|Richesse du vocabulaire|Correction grammaticale|Prononciation|points forts|axes d'amélioration|commentaire global|Introduction|Développement|Conclusion|Total|35 points/i.test(data.aiMessage)) {
                // Try to parse the structured evaluation from the AI message
                const evaluationData = parseEvaluationFromMessage(data.aiMessage);
                setEvaluation(evaluationData);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (phase !== 'exam') return;
        const assistantMessages = messages.filter(msg => msg.role === 'assistant');
        if (assistantMessages.length === 0) return;
        const latestIndex = messages.lastIndexOf(assistantMessages[assistantMessages.length - 1]);
        if (latestIndex <= lastPlayedAssistantIndexRef.current) return;
        lastPlayedAssistantIndexRef.current = latestIndex;
        const latestMessage = assistantMessages[assistantMessages.length - 1]?.content;
        if (latestMessage) {
            void playAudio(latestMessage);
        }
    }, [messages, phase]);

    // Get current examiner message (latest assistant message)

    const getExamStatus = () => {
        if (recording) return { label: 'Recording… Tap to stop', tone: 'text-red-600' };
        if (isTranscribing || loading) return { label: 'Processing…', tone: 'text-gray-600' };
        if (isPlaying) return { label: 'Examiner speaking…', tone: 'text-blue-600' };
        return { label: 'Tap the microphone to speak', tone: 'text-gray-600' };
    };

    // Parse evaluation from AI message
    const parseEvaluationFromMessage = (message: string): Evaluation => {
        const evaluation: Partial<Evaluation> = {};

        // Extract scores using regex patterns
        const scorePatterns: Record<string, RegExp> = {
            introduction: /introduction[:\s]*(\d+)/i,
            developpement: /développement[:\s]*(\d+)/i,
            conclusion: /conclusion[:\s]*(\d+)/i,
            coherence: /cohérence[:\s]*(\d+)/i,
            vocabulaire: /vocabulaire[:\s]*(\d+)/i,
            grammaire: /grammaire[:\s]*(\d+)/i,
            prononciation: /prononciation[:\s]*(\d+)/i,
            connecteurs: /connecteurs[:\s]*(\d+)/i,
            structure: /structure[:\s]*(\d+)/i,
            totalScore: /total[:\s]*(\d+)/i
        };

        // Extract scores
        Object.entries(scorePatterns).forEach(([key, pattern]) => {
            const match = message.match(pattern);
            if (match) {
                (evaluation as any)[key] = parseInt(match[1]);
            }
        });

        // Extract feedback sections
        const feedbackPatterns: Record<string, RegExp> = {
            feedbackIntroduction: /introduction[:\s]*([^.\n]+)/i,
            feedbackDeveloppement: /développement[:\s]*([^.\n]+)/i,
            feedbackConclusion: /conclusion[:\s]*([^.\n]+)/i,
            feedbackLangue: /langue[:\s]*([^.\n]+)/i
        };

        Object.entries(feedbackPatterns).forEach(([key, pattern]) => {
            const match = message.match(pattern);
            if (match) {
                (evaluation as any)[key] = match[1].trim();
            }
        });

        // Extract points forts and axes d'amélioration
        const pointsFortsMatch = message.match(/points forts[:\s]*([^.\n]+)/i);
        if (pointsFortsMatch) {
            evaluation.pointsForts = pointsFortsMatch[1].split(',').map(p => p.trim());
        }

        const axesMatch = message.match(/axes d'amélioration[:\s]*([^.\n]+)/i);
        if (axesMatch) {
            evaluation.axesAmelioration = axesMatch[1].split(',').map(a => a.trim());
        }

        // Set commentaire global as the full message if no structured data found
        if (!evaluation.commentaireGlobal) {
            evaluation.commentaireGlobal = message;
        }

        return evaluation as Evaluation;
    };


    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="text-center w-full">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">DELF B2 ORAL EXAM</h1>
                            {question && phase === 'preparation' && (
                                <div className="mt-2">
                                    <span className="font-semibold text-gray-700">SUJET:</span>
                                    <span className="ml-2 italic text-gray-600">{question}</span>
                                </div>
                            )}
                            {phase === 'exam' && (
                                <div className="mt-2">
                                    <span className="font-semibold text-gray-700 text-orange-600">EXAM IN PROGRESS</span>
                                    <span className="ml-2 text-sm text-gray-600">(Explain your topic from memory)</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating History Button */}
            <button
                className="fixed right-4 bottom-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg z-40"
                onClick={() => setShowHistory(true)}
            >
                Show History
            </button>

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-2xl max-h-[80vh] overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800">Conversation History</h3>
                            <button
                                className="text-gray-600 hover:text-gray-800"
                                onClick={() => setShowHistory(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto" style={{ maxHeight: '65vh' }}>
                            {messages.length > 0 ? (
                                <div className="space-y-3">
                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-50 ml-8' : 'bg-green-50 mr-8'}`}>
                                            <div className={`font-semibold text-base mb-1 ${msg.role === 'user' ? 'text-blue-700' : 'text-green-700'}`}>
                                                {msg.role === 'user' ? 'You' : 'Examiner'}:
                                            </div>
                                            <div className="text-gray-800 text-base md:text-lg leading-relaxed">{msg.content}</div>
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
                </div>
            )}

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Phase: Idle (Start) */}
                {phase === 'idle' && (
                    <div className="text-center">
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                            onClick={handleStartExamClick}
                            disabled={loading}
                        >
                            {loading ? 'Starting...' : 'Start Exam'}
                        </button>
                    </div>
                )}

                {/* Phase: Selection */}
                {phase === 'selection' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Choisissez un sujet</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {displayedCards.map((topic) => (
                                <button
                                    key={topic.id}
                                    className="text-left bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition p-4"
                                    onClick={() => handleSelectCard(topic)}
                                >
                                    <div className="font-semibold text-gray-900 mb-2 text-lg md:text-xl">{topic.title}</div>
                                    <div className="text-lg leading-8 text-gray-800">
                                        {renderParagraphs(topic.text, 'text-lg leading-8 text-gray-800 mb-4')}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">Source: {topic.source}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Phase: Preparation */}
                {phase === 'preparation' && selectedCard && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-800">Préparation en cours...</h2>
                            <div className="text-lg font-mono bg-gray-900 text-white px-3 py-1 rounded">{formatTime(prepSecondsLeft)}</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-semibold text-gray-900 text-lg md:text-xl">{selectedCard.title}</div>
                                <div className="flex items-center gap-2">
                                    <button className="px-2 py-1 rounded border text-sm" onClick={decreaseFont}>A-</button>
                                    <button className="px-2 py-1 rounded border text-sm" onClick={increaseFont}>A+</button>
                                </div>
                            </div>
                            <div className={`${scaleToTextClass[cardFontScale]} leading-8 md:leading-9 text-gray-800`}>
                                {renderParagraphs(selectedCard.text, `${scaleToTextClass[cardFontScale]} leading-8 md:leading-9 text-gray-800 mb-4`)}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">Source: {selectedCard.source}</div>
                        </div>
                        <div className="text-right">
                            <button
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md"
                                onClick={proceedToExam}
                            >
                                Proceed to Exam
                            </button>
                        </div>
                    </div>
                )}

                {/* Phase: Exam */}
                {phase === 'exam' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-800">Salle d'examen</h2>
                            <div className="flex items-center gap-3">
                                <button
                                    className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                    onClick={handleEndExamClick}
                                    disabled={loading}
                                >
                                    End Exam
                                </button>
                                <div className="text-lg font-mono bg-red-600 text-white px-3 py-1 rounded">{formatTime(examSecondsLeft)}</div>
                            </div>
                        </div>

                        {/* Audio-First UI (no visible text during exam) */}
                        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
                            <div className="flex flex-col items-center justify-center text-center space-y-4">
                                <button
                                    className={`relative inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-full bg-white border-2 ${recording ? 'border-red-600' : 'border-blue-600'} shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 ${recording ? 'focus:ring-red-200' : 'focus:ring-blue-200'} ${recording ? 'animate-pulse' : ''}`}
                                    onClick={recording ? stopRecording : startRecording}
                                    disabled={loading || isTranscribing}
                                    title={recording ? 'Stop Recording' : 'Start Recording'}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className={`w-10 h-10 ${recording ? 'text-red-600' : 'text-blue-600'}`}
                                    >
                                        <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3z" />
                                        <path d="M5 11a1 1 0 1 0-2 0 9 9 0 0 0 8 8v2a1 1 0 1 0 2 0v-2a9 9 0 0 0 8-8 1 1 0 1 0-2 0 7 7 0 1 1-14 0z" />
                                    </svg>
                                    {recording && (
                                        <span className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-red-600 animate-ping"></span>
                                    )}
                                </button>

                                <div className={`text-sm font-medium ${getExamStatus().tone}`}>{getExamStatus().label}</div>

                                {(isTranscribing || loading) && (
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Phase: Results */}
                {phase === 'results' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-800">Résultats et commentaires</h2>
                        </div>

                        {evaluation ? (
                            <div className="bg-white rounded-lg shadow-md border border-gray-200">
                                <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200 rounded-t-lg">
                                    <h3 className="font-semibold text-yellow-800">ÉVALUATION DELF B2</h3>
                                    <p className="text-xs text-yellow-600 mt-1">Évaluation structurée selon les critères officiels</p>
                                </div>
                                <div className="p-6">
                                    {evaluation.totalScore !== undefined && (
                                        <div className="mb-6 text-center">
                                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 border-4 border-blue-300">
                                                <span className="text-2xl font-bold text-blue-700">{evaluation.totalScore}/35</span>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-600">Note totale sur 35 points</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">STRUCTURE</h4>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium text-gray-700">Introduction</span>
                                                    {evaluation.introduction !== undefined && (
                                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold">{evaluation.introduction}/5</span>
                                                    )}
                                                </div>
                                                {evaluation.feedbackIntroduction && <p className="text-sm text-gray-600">{evaluation.feedbackIntroduction}</p>}
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium text-gray-700">Développement</span>
                                                    {evaluation.developpement !== undefined && (
                                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold">{evaluation.developpement}/10</span>
                                                    )}
                                                </div>
                                                {evaluation.feedbackDeveloppement && <p className="text-sm text-gray-600">{evaluation.feedbackDeveloppement}</p>}
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium text-gray-700">Conclusion</span>
                                                    {evaluation.conclusion !== undefined && (
                                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold">{evaluation.conclusion}/5</span>
                                                    )}
                                                </div>
                                                {evaluation.feedbackConclusion && <p className="text-sm text-gray-600">{evaluation.feedbackConclusion}</p>}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">LANGUE ET EXPRESSION</h4>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium text-gray-700">Cohérence</span>
                                                    {evaluation.coherence !== undefined && (
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">{evaluation.coherence}/5</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium text-gray-700">Vocabulaire</span>
                                                    {evaluation.vocabulaire !== undefined && (
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">{evaluation.vocabulaire}/5</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium text-gray-700">Grammaire</span>
                                                    {evaluation.grammaire !== undefined && (
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">{evaluation.grammaire}/5</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium text-gray-700">Prononciation</span>
                                                    {evaluation.prononciation !== undefined && (
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">{evaluation.prononciation}/5</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium text-gray-700">Connecteurs</span>
                                                    {evaluation.connecteurs !== undefined && (
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">{evaluation.connecteurs}/5</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {evaluation.pointsForts && evaluation.pointsForts.length > 0 && (
                                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                <h4 className="font-semibold text-green-800 mb-3">Points Forts</h4>
                                                <ul className="space-y-2">
                                                    {evaluation.pointsForts.map((point, index) => (
                                                        <li key={index} className="flex items-start">
                                                            <span className="text-green-600 mr-2">✓</span>
                                                            <span className="text-gray-700">{point}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {evaluation.axesAmelioration && evaluation.axesAmelioration.length > 0 && (
                                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                                <h4 className="font-semibold text-orange-800 mb-3">Axes d'Amélioration</h4>
                                                <ul className="space-y-2">
                                                    {evaluation.axesAmelioration.map((axe, index) => (
                                                        <li key={index} className="flex items-start">
                                                            <span className="text-orange-600 mr-2">→</span>
                                                            <span className="text-gray-700">{axe}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    {evaluation.commentaireGlobal && (
                                        <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <h4 className="font-semibold text-blue-800 mb-2">Commentaire Global</h4>
                                            <p className="text-gray-700 leading-relaxed">{evaluation.commentaireGlobal}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                                <p className="text-gray-700">Les résultats et commentaires apparaîtront ici lorsque disponibles.</p>
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