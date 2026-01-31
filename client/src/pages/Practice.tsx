import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { scriptsAPI, practiceAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import {
    Mic,
    MicOff,
    Play,
    Pause,
    Upload,
    CheckCircle,
    AlertCircle,
    Clock,
    Target,
    ZoomIn,
    ZoomOut,
    ArrowLeft,
    Volume2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Script {
    _id: string
    title: string
    textContent: string
    language: string
    difficulty: string
    referenceAudioURL?: string
}

interface WordComparison {
    originalWord: string;
    spokenWord: string;
    isCorrect: boolean;
    position: number;
}

interface PronunciationAnalysis {
    wordComparisons: WordComparison[];
    correctWords: number;
    totalWords: number;
    mistakeCount: number;
}

interface PracticeResult {
    id: string;
    score: number;
    accuracy: number;
    fluency: number;
    duration: number;
    wordsPerMinute?: number;
    feedback: string;
    transcript?: string;
    originalScript?: string;
    pronunciationAnalysis?: PronunciationAnalysis;
}

// Helper function to get MIME type based on file extension
const getAudioMimeType = (url: string | undefined): { url: string; type: string } | null => {
    if (!url) return null;
    
    // If URL is already a full Cloudinary URL, use it directly
    if (url.startsWith('http://') || url.startsWith('https://')) {
        // Detect MIME type from URL
        if (url.includes('.webm')) {
            return { url, type: 'audio/webm' };
        } else if (url.includes('.mp3')) {
            return { url, type: 'audio/mpeg' };
        } else if (url.includes('.wav')) {
            return { url, type: 'audio/wav' };
        } else if (url.includes('.m4a')) {
            return { url, type: 'audio/mp4' };
        }
        return { url, type: 'audio/*' };
    }
    
    // For relative URLs (backward compatibility with old filesystem paths)
    const apiBaseUrl = import.meta.env.VITE_API_URL || 
        (window.location.hostname === 'localhost' 
            ? 'http://localhost:5000/api' 
            : '/api');
    
    // Remove /api suffix to get the server base URL
    const serverUrl = apiBaseUrl.replace(/\/api$/, '');
    const fullUrl = `${serverUrl}${url}`;
    
    if (url.endsWith('.webm')) {
        return { url: fullUrl, type: 'audio/webm' };
    } else if (url.endsWith('.mp3')) {
        return { url: fullUrl, type: 'audio/mpeg' };
    } else if (url.endsWith('.wav')) {
        return { url: fullUrl, type: 'audio/wav' };
    } else if (url.endsWith('.m4a')) {
        return { url: fullUrl, type: 'audio/mp4' };
    }
    // Default fallback for unknown types
    return { url: fullUrl, type: 'audio/*' };
};

export const Practice: React.FC = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [scripts, setScripts] = useState<Script[]>([])
    const [selectedScript, setSelectedScript] = useState<Script | null>(null)
    const [isRecording, setIsRecording] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [finalRecordingTime, setFinalRecordingTime] = useState(0)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [audioURL, setAudioURL] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [practiceResult, setPracticeResult] = useState<PracticeResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [fontSize, setFontSize] = useState(16) // Font size in pixels
    const [selectedLanguage, setSelectedLanguage] = useState<string>(user?.preferredLanguages?.[0] || '')
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
    const [transcriptFontSize, setTranscriptFontSize] = useState(16)
    const [transcriptFontFamily, setTranscriptFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans')

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const referenceAudioRef = useRef<HTMLAudioElement | null>(null)
    const scriptTopRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        fetchScripts()
    }, [selectedLanguage, selectedDifficulty])

    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [isRecording])

    // Handle reference audio loading
    useEffect(() => {
        if (selectedScript?.referenceAudioURL) {
            // Find the audio element on the page
            const audioElement = document.querySelector('audio[controls]') as HTMLAudioElement;
            if (audioElement) {
                console.log('[AUDIO] Resetting audio element for:', selectedScript.referenceAudioURL);
                // Reset the audio element to trigger fresh loading
                audioElement.load();
            }
        }
    }, [selectedScript?._id])

    const fetchScripts = async () => {
        try {
            // Get user's preferred languages or show all languages
            const userLanguages = selectedLanguage 
                ? [selectedLanguage] 
                : ['english', 'french', 'swahili'] // Show all languages when no specific language is selected
            
            const params: any = {
                languages: userLanguages.join(','), // Send as comma-separated string
                limit: 50,
                fromDate: '2026-01-29' // Hide all old scripts
            }
            
            if (selectedDifficulty) params.difficulty = selectedDifficulty
                
            const response = await scriptsAPI.getAll(params)
            
            // Additional client-side filtering to ensure only selected languages are shown
            const filteredByLanguage = response.data.scripts.filter(
                (script: Script) => userLanguages.some(lang => 
                    script.language.toLowerCase() === lang.toLowerCase()
                )
            )
            
            // Sort scripts by difficulty level: beginner → intermediate → advanced
            const difficultyOrder: { [key: string]: number } = {
                'beginner': 1,
                'intermediate': 2,
                'advanced': 3
            }
            
            const sortedScripts = filteredByLanguage.sort((a: Script, b: Script) => {
                const diffA = difficultyOrder[a.difficulty.toLowerCase()] || 999
                const diffB = difficultyOrder[b.difficulty.toLowerCase()] || 999
                return diffA - diffB
            })
            
            // Debug: Log scripts with reference audio
            sortedScripts.forEach((script: Script) => {
                if (script.referenceAudioURL) {
                    console.log(`Script "${script.title}" has reference audio:`, script.referenceAudioURL);
                }
            })
            
            setScripts(sortedScripts)
        } catch (error) {
            console.error('Error fetching scripts:', error)
            toast.error('Failed to load scripts')
        } finally {
            setLoading(false)
        }
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            // Use MP3 format which is well-supported by OpenAI Whisper
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            })
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data)
            }

            mediaRecorder.onstop = () => {
                // Create blob with WebM format (OpenAI supports webm)
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                setAudioBlob(audioBlob)
                setAudioURL(URL.createObjectURL(audioBlob))
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingTime(0)
            toast.success('Recording started')
        } catch (error) {
            console.error('Error starting recording:', error)
            toast.error('Failed to start recording. Please check microphone permissions.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setFinalRecordingTime(recordingTime) // Save the final time
            toast.success('Recording stopped')
        }
    }

    const playRecording = () => {
        if (audioURL && audioRef.current) {
            audioRef.current.play()
            setIsPlaying(true)
        }
    }

    const pauseRecording = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            setIsPlaying(false)
        }
    }

    const playReferenceAudio = () => {
        if (referenceAudioRef.current) {
            referenceAudioRef.current.play()
            return
        }
        toast.error('Reference audio is not available')
    }

    const playStudentAudio = () => {
        if (audioRef.current && audioURL) {
            audioRef.current.play()
            setIsPlaying(true)
            return
        }
        toast.error('Student recording is not available')
    }

    const submitPractice = async () => {
        if (!selectedScript || !audioBlob) {
            toast.error('Please select a script and record audio')
            return
        }

        setIsProcessing(true)
        try {
            const formData = new FormData()
            formData.append('scriptId', selectedScript._id)
            formData.append('duration', recordingTime.toString())
            formData.append('audio', audioBlob, 'recording.webm')

            // Debug: Log what we're sending
            console.log('=== FRONTEND DEBUG ===')
            console.log('Selected script:', selectedScript)
            console.log('Audio blob size:', audioBlob.size)
            console.log('Audio blob type:', audioBlob.type)
            console.log('Duration:', recordingTime)
            console.log('FormData entries:')
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value)
            }
            console.log('========================')

            const response = await practiceAPI.submit(formData)
            setPracticeResult(response.data.session)
            toast.success('Practice session submitted successfully!')
        } catch (error) {
            console.error('Error submitting practice:', error)
            toast.error('Failed to submit practice session')
        } finally {
            setIsProcessing(false)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-success-600'
        if (score >= 60) return 'text-warning-600'
        return 'text-error-600'
    }

    // Component to render pronunciation analysis with color coding
    const PronunciationDisplay: React.FC<{ analysis: PronunciationAnalysis }> = ({ analysis }) => {
        return (
            <div className="space-y-4">
                <div>
                    <h3 className="font-medium text-gray-900 mb-2">Your Speech (Pronunciation Analysis)</h3>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm leading-relaxed">
                        {analysis.wordComparisons.map((comparison, index) => (
                            <span key={index} className="inline-block mr-1">
                                {comparison.isCorrect ? (
                                    // Correct word - normal color
                                    <span className="text-gray-800">{comparison.spokenWord}</span>
                                ) : (
                                    // Incorrect word - red for mispronounced, green for correction
                                    <span className="inline-block">
                                        <span className="text-red-600 line-through font-medium">
                                            {comparison.spokenWord}
                                        </span>
                                        <span className="text-green-600 font-medium ml-1">
                                            {comparison.originalWord}
                                        </span>
                                    </span>
                                )}
                                {index < analysis.wordComparisons.length - 1 && ' '}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{analysis.totalWords}</div>
                        <div className="text-sm text-gray-600">Total Words</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-600">{analysis.mistakeCount}</div>
                        <div className="text-sm text-gray-600">Mistakes</div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Practice Session</h1>
                <p className="text-gray-600">
                    Select a script, record your voice, and get AI feedback
                </p>
            </div>

            {!selectedScript ? (
                /* Script Selection Grid - Show all scripts */
                <>
                    {/* Filters */}
                    <div className="card">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Language Filter */}
                            <div className="flex-shrink-0">
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value)}
                                    className="input-field"
                                >
                                    <option value="">All Languages</option>
                                    <option value="english">English</option>
                                    <option value="french">French</option>
                                    <option value="swahili">Swahili</option>
                                </select>
                            </div>

                            {/* Difficulty Filter */}
                            <div className="flex-shrink-0">
                                <select
                                    value={selectedDifficulty}
                                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                                    className="input-field"
                                >
                                    <option value="">All Difficulties</option>
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Script</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Showing scripts in <span className="font-semibold capitalize">
                            {selectedLanguage ? selectedLanguage : 'English, French, and Swahili'}
                        </span>
                    </p>

                    {scripts.length > 0 ? (
                        <div className="space-y-6 max-h-96 overflow-y-auto">
                            {['beginner', 'intermediate', 'advanced'].map((level) => {
                                const levelScripts = scripts.filter(
                                    (script) => script.difficulty.toLowerCase() === level
                                )
                                
                                if (levelScripts.length === 0) return null

                                return (
                                    <div key={level}>
                                        {/* Difficulty Level Header */}
                                        <div className="flex items-center space-x-3 mb-3">
                                            <h3 className="text-sm font-semibold text-gray-700 uppercase capitalize">
                                                {level}
                                            </h3>
                                            <div className="flex-1 h-px bg-gray-200"></div>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {levelScripts.length} script{levelScripts.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>

                                        {/* Scripts in this difficulty level */}
                                        <div className="space-y-2 ml-4">
                                            {levelScripts.map((script) => (
                                                <div
                                                    key={script._id}
                                                    className="p-3 border rounded-lg cursor-pointer transition-colors border-gray-200 hover:border-primary-300 hover:bg-primary-50"
                                                    onClick={() => setSelectedScript(script)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="font-medium text-gray-900 text-sm">{script.title}</h3>
                                                        </div>
                                                        <CheckCircle className="h-4 w-4 text-gray-300" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No scripts available for the selected filters</p>
                        </div>
                    )}
                </div>
                </>
            ) : (
                /* Centered Script View - Show only selected script */
                <div className="max-w-4xl mx-auto">
                    <div className="card" ref={scriptTopRef}>
                        {/* Back Button */}
                        <button
                            onClick={() => {
                                setSelectedScript(null)
                                setAudioBlob(null)
                                setAudioURL('')
                                setRecordingTime(0)
                                setFinalRecordingTime(0)
                            }}
                            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to script list
                        </button>

                        {/* Script Title */}
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">{selectedScript.title}</h2>
                            <p className="text-sm text-gray-500 capitalize mt-1">
                                {selectedScript.language} • {selectedScript.difficulty}
                            </p>
                        </div>
                        {/* Reference Audio Player - Always Visible */}
                        {selectedScript.referenceAudioURL && (
                            <div className="w-full max-w-2xl mx-auto bg-primary-50 border-2 border-primary-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center mb-3">
                                    <Volume2 className="h-5 w-5 text-primary-600 mr-2" />
                                    <span className="text-sm font-medium text-primary-700">
                                        Reference Audio - Listen & Compare
                                    </span>
                                </div>
                                {(() => {
                                    const mimeInfo = getAudioMimeType(selectedScript.referenceAudioURL);
                                    return (
                                        <audio
                                            key={selectedScript._id}
                                            ref={referenceAudioRef}
                                            src={mimeInfo?.url}
                                            controls
                                            controlsList="nodownload"
                                            crossOrigin="anonymous"
                                            preload="metadata"
                                            style={{
                                                width: '100%',
                                                outline: 'none',
                                            }}
                                            onLoadStart={(e: any) => {
                                                const audio = e.target as HTMLAudioElement;
                                                const canPlay = audio && typeof audio.canPlayType === 'function' 
                                                    ? audio.canPlayType(mimeInfo?.type || '') 
                                                    : 'unknown';
                                                console.log(`[AUDIO] Loading: ${selectedScript.referenceAudioURL}`, {
                                                    mimeType: mimeInfo?.type,
                                                    canPlayType: canPlay
                                                });
                                            }}
                                            onLoadedMetadata={(e: any) => {
                                                console.log(`[AUDIO] Metadata loaded for: ${selectedScript.referenceAudioURL}`);
                                                console.log(`[AUDIO] Duration: ${(e.target as HTMLAudioElement).duration}s`);
                                            }}
                                            onCanPlay={() => {
                                                console.log(`[AUDIO] Can play: ${selectedScript.referenceAudioURL}`);
                                            }}
                                            onPlay={() => {
                                                console.log(`[AUDIO] Playing: ${selectedScript.referenceAudioURL}`);
                                            }}
                                            onError={(e: any) => {
                                                const audio = e.target as HTMLAudioElement;
                                                const errorCode = audio?.error?.code;
                                                const errorMessage = audio?.error?.message;
                                                const canPlay = audio && typeof audio.canPlayType === 'function'
                                                    ? audio.canPlayType(mimeInfo?.type || '')
                                                    : 'unknown';
                                                const errorCodes: {[key: number]: string} = {
                                                    1: 'MEDIA_ERR_ABORTED',
                                                    2: 'MEDIA_ERR_NETWORK',
                                                    3: 'MEDIA_ERR_DECODE',
                                                    4: 'MEDIA_ERR_SRC_NOT_SUPPORTED'
                                                };
                                                const errMsg = errorCode ? errorCodes[errorCode] || 'Unknown error' : 'Unknown error';
                                                console.error(`[AUDIO ERROR] for "${selectedScript.title}":`, {
                                                    url: selectedScript.referenceAudioURL,
                                                    errorCode: errorCode,
                                                    errorType: errMsg,
                                                    errorMessage: errorMessage,
                                                    detectedMimeType: mimeInfo?.type,
                                                    detectedExtension: selectedScript.referenceAudioURL?.split('.').pop(),
                                                    canPlayType: canPlay,
                                                    currentSrc: audio?.currentSrc,
                                                    networkState: audio?.networkState,
                                                    readyState: audio?.readyState
                                                });
                                                // Only show toast on format not supported
                                                if (errorCode === 4) {
                                                    toast.error('Audio format not supported. MP3/WAV files required.');
                                                } else if (errorCode === 2) {
                                                    toast.error('Network error loading audio. Check server.');
                                                }
                                            }}
                                        />
                                    );
                                })()}
                                <p className="text-xs text-primary-600 mt-2">
                                    {!isRecording && !audioBlob 
                                        ? 'Listen to how the script should be pronounced before recording'
                                        : isRecording 
                                        ? 'Reference audio available during recording'
                                        : 'Compare your recording with the reference pronunciation'
                                    }
                                </p>
                            </div>
                        )}

                        {/* Start Recording Button - At Top */}
                        {!isRecording && !audioBlob && (
                            <div className="flex flex-col items-center space-y-4 mb-6">
                                <button
                                    onClick={startRecording}
                                    className="btn-primary flex items-center text-lg py-3 px-6"
                                    disabled={isProcessing}
                                >
                                    <Mic className="h-6 w-6 mr-2" />
                                    Start Recording
                                </button>
                            </div>
                        )}

                        {/* Recording Timer - Visible during and after recording */}
                        {(isRecording || finalRecordingTime > 0) && (
                            <div className="text-center mb-4">
                                <div className="inline-flex items-center space-x-2 bg-primary-50 px-6 py-3 rounded-lg">
                                    <Clock className="h-5 w-5 text-primary-600" />
                                    <div className="text-2xl font-bold text-primary-600">
                                        {formatTime(isRecording ? recordingTime : finalRecordingTime)}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    {isRecording ? 'Recording in progress...' : 'Recording duration'}
                                </p>
                            </div>
                        )}

                        {/* Font Size Controls */}
                        <div className="flex items-center justify-center space-x-4 mb-4">
                            <button
                                onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                                className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                                title="Decrease font size"
                            >
                                <ZoomOut className="h-4 w-4" />
                                <span>Smaller</span>
                            </button>
                            <span className="text-sm text-gray-600">Font Size: {fontSize}px</span>
                            <button
                                onClick={() => setFontSize(prev => Math.min(32, prev + 2))}
                                className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                                title="Increase font size"
                            >
                                <ZoomIn className="h-4 w-4" />
                                <span>Larger</span>
                            </button>
                        </div>

                        {/* Script Content with Adjustable Font */}
                        <div className="bg-gray-50 p-6 rounded-lg mb-6 max-h-96 overflow-y-auto">
                            <p 
                                className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                                style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
                            >
                                {selectedScript.textContent}
                            </p>
                        </div>

                        {/* Stop Recording Button - At Bottom */}
                        {isRecording && (
                            <div className="flex justify-center mb-6">
                                <button
                                    onClick={stopRecording}
                                    className="btn-error flex items-center text-lg py-3 px-6 animate-pulse"
                                >
                                    <MicOff className="h-6 w-6 mr-2" />
                                    Stop Recording
                                </button>
                            </div>
                        )}

                        {/* Audio Playback & Submit */}
                        {audioURL && !isRecording && (
                            <div className="space-y-4 border-t pt-6">
                                <h3 className="font-semibold text-gray-900 text-center">Playback & Submit</h3>
                                
                                <div className="flex items-center justify-center space-x-3">
                                    {!isPlaying ? (
                                        <button
                                            onClick={playRecording}
                                            className="btn-secondary flex items-center"
                                        >
                                            <Play className="h-4 w-4 mr-2" />
                                            Play Recording
                                        </button>
                                    ) : (
                                        <button
                                            onClick={pauseRecording}
                                            className="btn-secondary flex items-center"
                                        >
                                            <Pause className="h-4 w-4 mr-2" />
                                            Pause
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            setAudioBlob(null)
                                            setAudioURL('')
                                            setRecordingTime(0)
                                            setFinalRecordingTime(0)
                                            // Scroll to top of script card
                                            scriptTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                        }}
                                        className="btn-secondary"
                                    >
                                        Re-record
                                    </button>
                                </div>

                                <audio
                                    ref={audioRef}
                                    src={audioURL}
                                    onEnded={() => setIsPlaying(false)}
                                    className="w-full"
                                />

                                <button
                                    onClick={submitPractice}
                                    disabled={isProcessing}
                                    className="btn-success w-full flex items-center justify-center text-lg py-3"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-5 w-5 mr-2" />
                                            Submit Practice
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Practice Results */}
            {practiceResult && (
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Practice Results</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className={`text-3xl font-bold ${getScoreColor(practiceResult.score)}`}>
                                {practiceResult.score}%
                            </div>
                            <div className="text-sm text-gray-600">Overall Score</div>
                        </div>

                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                                {practiceResult.accuracy}%
                            </div>
                            <div className="text-sm text-gray-600">Accuracy</div>
                        </div>

                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                                {practiceResult.fluency}%
                            </div>
                            <div className="text-sm text-gray-600">Fluency</div>
                        </div>
                    </div>

                    {/* Pronunciation Analysis */}
                    {practiceResult.pronunciationAnalysis ? (
                        <div className="mb-6">
                            <PronunciationDisplay analysis={practiceResult.pronunciationAnalysis} />
                        </div>
                    ) : practiceResult.transcript && (
                        <div className="mb-6">
                            <div>
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-2">
                                    <h3 className="font-medium text-gray-900">Your Speech (Transcribed)</h3>
                                    <div className="flex flex-wrap items-center gap-2 justify-end">
                                        <button
                                            onClick={playReferenceAudio}
                                            className="btn-secondary flex items-center text-xs px-3 py-2"
                                            title="Play reference audio"
                                        >
                                            <Volume2 className="h-4 w-4 mr-1" />
                                            Play Reference
                                        </button>
                                        <button
                                            onClick={playStudentAudio}
                                            className="btn-secondary flex items-center text-xs px-3 py-2"
                                            title="Play your recording"
                                        >
                                            <Play className="h-4 w-4 mr-1" />
                                            Play Student
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 justify-end mb-2">
                                    <button
                                        onClick={() => setTranscriptFontSize(prev => Math.max(12, prev - 2))}
                                        className="flex items-center space-x-1 px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                                        title="Decrease transcript font size"
                                    >
                                        <ZoomOut className="h-3 w-3" />
                                        <span>Smaller</span>
                                    </button>
                                    <button
                                        onClick={() => setTranscriptFontSize(prev => Math.min(26, prev + 2))}
                                        className="flex items-center space-x-1 px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                                        title="Increase transcript font size"
                                    >
                                        <ZoomIn className="h-3 w-3" />
                                        <span>Larger</span>
                                    </button>
                                    <select
                                        value={transcriptFontFamily}
                                        onChange={(e) => setTranscriptFontFamily(e.target.value as 'sans' | 'serif' | 'mono')}
                                        className="text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white"
                                        title="Change transcript font"
                                    >
                                        <option value="sans">Sans</option>
                                        <option value="serif">Serif</option>
                                        <option value="mono">Mono</option>
                                    </select>
                                </div>

                                <div
                                    className="bg-gray-50 p-3 rounded-lg text-sm"
                                    style={{
                                        fontSize: `${transcriptFontSize}px`,
                                        fontFamily:
                                            transcriptFontFamily === 'serif'
                                                ? 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
                                                : transcriptFontFamily === 'mono'
                                                ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                                                : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                                    }}
                                >
                                    {practiceResult.transcript}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Additional Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-5 w-5 text-gray-400" />
                            <span className="text-sm text-gray-600">
                                Duration: {formatTime(practiceResult.duration)}
                            </span>
                        </div>

                        {practiceResult.wordsPerMinute && (
                            <div className="flex items-center space-x-2">
                                <Target className="h-5 w-5 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                    {practiceResult.wordsPerMinute} WPM
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Feedback */}
                    <div className="mb-6">
                        <h3 className="font-medium text-gray-900 mb-2">Feedback</h3>
                        <div className="space-y-2">
                            {practiceResult.feedback.split('. ').map((comment, index) => (
                                comment.trim() && (
                                    <div key={index} className="flex items-start space-x-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-gray-700">{comment.trim()}</span>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                        <button
                            onClick={() => {
                                setPracticeResult(null)
                                setSelectedScript(null)
                                setAudioBlob(null)
                                setAudioURL('')
                                setRecordingTime(0)
                            }}
                            className="btn-secondary"
                        >
                            Practice Again
                        </button>

                        <button
                            onClick={() => navigate('/history')}
                            className="btn-primary"
                        >
                            View History
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
} 