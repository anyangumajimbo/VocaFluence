import React, { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Play, Pause, MessageSquare, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface Feedback {
    _id: string
    text: string
    referenceAudio?: string
    status: 'pending' | 'reviewed' | 'resolved'
    createdAt: string
    adminId: {
        _id: string
        name: string
    }
    activityId: {
        _id: string
        title: string
        textContent: string
        createdAt: string
    }
}

const Feedback: React.FC = () => {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
    const [loading, setLoading] = useState(true)
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
    const audioElementsRef = React.useRef<Map<string, HTMLAudioElement>>(new Map())

    useEffect(() => {
        fetchFeedback()
    }, [])

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            audioElementsRef.current.forEach((audio) => {
                try {
                    audio.pause()
                    URL.revokeObjectURL(audio.src)
                } catch (err) {
                    // ignore cleanup errors
                }
            })
            audioElementsRef.current.clear()
        }
    }, [])

    const fetchFeedback = async () => {
        setLoading(true)
        try {
            const res = await api.get('/admin/student/feedback')
            setFeedbacks(res.data)
        } catch (err: any) {
            toast.error('Failed to fetch feedback')
        } finally {
            setLoading(false)
        }
    }

    const playReferenceAudio = async (commentId: string) => {
        try {
            const existing = audioElementsRef.current.get(commentId)

            if (existing) {
                if (!existing.paused) {
                    existing.pause()
                    setPlayingAudioId(null)
                    return
                }

                await existing.play()
                setPlayingAudioId(commentId)
                return
            }

            audioElementsRef.current.forEach((audio) => {
                audio.pause()
                audio.currentTime = 0
            })

            setPlayingAudioId(commentId)
            const res = await api.get(`/admin/student/comments/${commentId}/reference-audio`, {
                responseType: 'blob',
            })
            const audioUrl = URL.createObjectURL(res.data)
            const audio = new Audio(audioUrl)

            audioElementsRef.current.set(commentId, audio)

            audio.onended = () => {
                setPlayingAudioId(null)
                URL.revokeObjectURL(audioUrl)
                audioElementsRef.current.delete(commentId)
            }

            audio.onerror = () => {
                setPlayingAudioId(null)
                URL.revokeObjectURL(audioUrl)
                audioElementsRef.current.delete(commentId)
                toast.error('Failed to play audio')
            }

            await audio.play()
        } catch (err) {
            setPlayingAudioId(null)
            toast.error('Failed to load audio')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved':
                return 'bg-green-50 border-green-300'
            case 'reviewed':
                return 'bg-blue-50 border-blue-300'
            default:
                return 'bg-yellow-50 border-yellow-300'
        }
    }

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'resolved':
                return 'bg-green-200 text-green-800'
            case 'reviewed':
                return 'bg-blue-200 text-blue-800'
            default:
                return 'bg-yellow-200 text-yellow-800'
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-3 mb-2">
                        <MessageSquare size={32} className="text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Your Feedback</h1>
                    </div>
                    <p className="text-gray-600">Comments and guidance from your instructors</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-gray-500">Loading feedback...</div>
                    </div>
                ) : feedbacks.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
                        <Star size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No feedback yet</p>
                        <p className="text-gray-400 mt-2">Your instructors will review your activities and provide feedback here</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {feedbacks.map((feedback) => (
                            <div
                                key={feedback._id}
                                className={`bg-white rounded-lg shadow-md border-l-4 p-6 ${getStatusColor(feedback.status)}`}
                            >
                                {/* Activity Info */}
                                <div className="mb-4 pb-4 border-b border-gray-200">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{feedback.activityId.title}</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {format(new Date(feedback.activityId.createdAt), 'MMM dd, yyyy • HH:mm')}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(feedback.status)}`}>
                                            {feedback.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 text-sm mt-2 italic">{feedback.activityId.textContent}</p>
                                </div>

                                {/* Comment from Instructor */}
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-800 mb-2">Feedback from {feedback.adminId.name}</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-gray-700 whitespace-pre-wrap">{feedback.text}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {format(new Date(feedback.createdAt), 'MMM dd, yyyy • HH:mm')}
                                    </p>
                                </div>

                                {/* Reference Audio */}
                                {feedback.referenceAudio && (
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <span className="text-purple-600">🎵</span>
                                            Reference Pronunciation Guide
                                        </h4>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Listen to the correct pronunciation of the text to improve your speaking:
                                        </p>
                                        <button
                                            onClick={() => playReferenceAudio(feedback._id)}
                                            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            {playingAudioId === feedback._id ? (
                                                <>
                                                    <Pause size={18} />
                                                    Pause
                                                </>
                                            ) : (
                                                <>
                                                    <Play size={18} />
                                                    Play Reference Audio
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Feedback
