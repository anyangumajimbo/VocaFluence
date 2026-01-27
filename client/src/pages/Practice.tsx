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
    ArrowLeft
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

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const scriptTopRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        fetchScripts()
    }, [])

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

    const fetchScripts = async () => {
        try {
            const response = await scriptsAPI.getAll({
                language: user?.preferredLanguage,
                limit: 50
            })
            setScripts(response.data.scripts)
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
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Script</h2>

                    {scripts.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {scripts.map((script) => (
                                <div
                                    key={script._id}
                                    className="p-4 border rounded-lg cursor-pointer transition-colors border-gray-200 hover:border-primary-300 hover:bg-primary-50"
                                    onClick={() => setSelectedScript(script)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900">{script.title}</h3>
                                            <p className="text-sm text-gray-500 capitalize">
                                                {script.language} • {script.difficulty}
                                            </p>
                                        </div>
                                        <CheckCircle className="h-5 w-5 text-gray-300" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No scripts available</p>
                        </div>
                    )}
                </div>
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

                        {/* Start Recording Button - At Top */}
                        {!isRecording && !audioBlob && (
                            <div className="flex justify-center mb-6">
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
                                <h3 className="font-medium text-gray-900 mb-2">Your Speech (Transcribed)</h3>
                                <div className="bg-gray-50 p-3 rounded-lg text-sm">
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