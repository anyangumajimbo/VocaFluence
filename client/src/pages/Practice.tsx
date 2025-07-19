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
    Target
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
}

export const Practice: React.FC = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [scripts, setScripts] = useState<Script[]>([])
    const [selectedScript, setSelectedScript] = useState<Script | null>(null)
    const [isRecording, setIsRecording] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [audioURL, setAudioURL] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [practiceResult, setPracticeResult] = useState<PracticeResult | null>(null)
    const [loading, setLoading] = useState(true)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const timerRef = useRef<number | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Script Selection */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Script</h2>

                    {scripts.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {scripts.map((script) => (
                                <div
                                    key={script._id}
                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedScript?._id === script._id
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    onClick={() => setSelectedScript(script)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900">{script.title}</h3>
                                            <p className="text-sm text-gray-500 capitalize">
                                                {script.language} • {script.difficulty}
                                            </p>
                                        </div>
                                        {selectedScript?._id === script._id && (
                                            <CheckCircle className="h-5 w-5 text-primary-600" />
                                        )}
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

                {/* Recording Section */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Voice Recording</h2>

                    {selectedScript ? (
                        <div className="space-y-4">
                            {/* Script Preview */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-900 mb-2">{selectedScript.title}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {selectedScript.textContent}
                                </p>
                            </div>

                            {/* Recording Controls */}
                            <div className="flex items-center justify-center space-x-4">
                                {!isRecording ? (
                                    <button
                                        onClick={startRecording}
                                        className="btn-primary flex items-center"
                                        disabled={isProcessing}
                                    >
                                        <Mic className="h-5 w-5 mr-2" />
                                        Start Recording
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopRecording}
                                        className="btn-error flex items-center"
                                    >
                                        <MicOff className="h-5 w-5 mr-2" />
                                        Stop Recording
                                    </button>
                                )}
                            </div>

                            {/* Recording Timer */}
                            {isRecording && (
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary-600">
                                        {formatTime(recordingTime)}
                                    </div>
                                    <p className="text-sm text-gray-500">Recording in progress...</p>
                                </div>
                            )}

                            {/* Audio Playback */}
                            {audioURL && !isRecording && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-center space-x-2">
                                        {!isPlaying ? (
                                            <button
                                                onClick={playRecording}
                                                className="btn-secondary flex items-center"
                                            >
                                                <Play className="h-4 w-4 mr-1" />
                                                Play
                                            </button>
                                        ) : (
                                            <button
                                                onClick={pauseRecording}
                                                className="btn-secondary flex items-center"
                                            >
                                                <Pause className="h-4 w-4 mr-1" />
                                                Pause
                                            </button>
                                        )}
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
                                        className="btn-success w-full flex items-center justify-center"
                                    >
                                        {isProcessing ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        ) : (
                                            <Upload className="h-5 w-5 mr-2" />
                                        )}
                                        {isProcessing ? 'Processing...' : 'Submit Practice'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Select a script to start practicing</p>
                        </div>
                    )}
                </div>
            </div>

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

                    {/* Transcript Comparison */}
                    {practiceResult.transcript && practiceResult.originalScript && (
                        <div className="space-y-4 mb-6">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Original Script</h3>
                                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                                    {practiceResult.originalScript}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Your Speech (Transcribed)</h3>
                                <div className="bg-green-50 p-3 rounded-lg text-sm">
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