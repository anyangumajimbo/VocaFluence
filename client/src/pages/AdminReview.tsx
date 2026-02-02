import React, { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Play, Pause, Trash2, MessageSquare, CheckCircle, Mic, Square, Users, UserCog } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface Student {
    _id: string
    name: string
    email: string
    activityCount: number
    pendingComments: number
}

interface Admin {
    _id: string
    name: string
    email: string
    commentCount: number
    pendingComments: number
    reviewedComments: number
}

interface Activity {
    _id: string
    title: string
    activityType: string
    textContent: string
    audioBuffer?: string
    accuracy?: number
    fluency?: number
    createdAt: string
    commentCount: number
    lastComment?: {
        text: string
        adminName: string
        createdAt: string
    }
    oralExamSession?: {
        question: string
        messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
        evaluation?: {
            coherence?: number
            vocabulaire?: number
            grammaire?: number
            prononciation?: number
            totalScore?: number
            pointsForts?: string[]
            axesAmelioration?: string[]
            commentaireGlobal?: string
        }
        createdAt: string
    } | null
}

interface Comment {
    _id: string
    text: string
    referenceAudio?: string
    status: 'pending' | 'reviewed' | 'resolved'
    createdAt: string
    adminId: {
        _id: string
        name: string
    }
    studentId?: {
        _id: string
        name: string
        email: string
    }
    activityId?: {
        _id: string
        title: string
        textContent: string
        createdAt: string
    }
}

const AdminReview: React.FC = () => {
    const [viewMode, setViewMode] = useState<'students' | 'admins'>('students')
    const [students, setStudents] = useState<Student[]>([])
    const [admins, setAdmins] = useState<Admin[]>([])
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
    const [activities, setActivities] = useState<Activity[]>([])
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [adminComments, setAdminComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)
    const [activitiesLoading, setActivitiesLoading] = useState(false)
    const [commentsLoading, setCommentsLoading] = useState(false)
    const [playingId, setPlayingId] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [isRecording, setIsRecording] = useState(false)
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
    const audioElementsRef = React.useRef<Map<string, HTMLAudioElement>>(new Map())

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

    // Fetch all students
    useEffect(() => {
        if (viewMode === 'students') {
            fetchStudents()
        } else {
            fetchAdmins()
        }
    }, [viewMode])

    const fetchStudents = async () => {
        setLoading(true)
        try {
            const res = await api.get('/admin/review/students')
            setStudents(res.data)
        } catch (err: any) {
            toast.error('Failed to fetch students')
        } finally {
            setLoading(false)
        }
    }

    const fetchAdmins = async () => {
        setLoading(true)
        try {
            const res = await api.get('/admin/review/admins')
            setAdmins(res.data)
        } catch (err: any) {
            toast.error('Failed to fetch admins')
        } finally {
            setLoading(false)
        }
    }

    const fetchActivities = async (studentId: string) => {
        setActivitiesLoading(true)
        try {
            const res = await api.get(`/admin/review/students/${studentId}/activities`, {
                params: { limit: 10, skip: (currentPage - 1) * 10 },
            })
            setActivities(res.data.activities)
        } catch (err: any) {
            toast.error('Failed to fetch activities')
        } finally {
            setActivitiesLoading(false)
        }
    }

    const fetchAdminComments = async (adminId: string) => {
        setCommentsLoading(true)
        try {
            const res = await api.get(`/admin/review/admins/${adminId}/comments`, {
                params: { limit: 20, skip: 0 },
            })
            setAdminComments(res.data.comments)
        } catch (err: any) {
            toast.error('Failed to fetch admin comments')
        } finally {
            setCommentsLoading(false)
        }
    }

    const fetchComments = async (activityId: string) => {
        setCommentsLoading(true)
        try {
            const res = await api.get(`/admin/review/comments/${activityId}`)
            setComments(res.data)
        } catch (err: any) {
            toast.error('Failed to fetch comments')
        } finally {
            setCommentsLoading(false)
        }
    }

    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student)
        setSelectedAdmin(null)
        setCurrentPage(1)
        setSelectedActivity(null)
        setComments([])
        setAdminComments([])
        fetchActivities(student._id)
    }

    const handleSelectAdmin = (admin: Admin) => {
        setSelectedAdmin(admin)
        setSelectedStudent(null)
        setSelectedActivity(null)
        setComments([])
        setActivities([])
        fetchAdminComments(admin._id)
    }

    const handleSelectActivity = (activity: Activity) => {
        setSelectedActivity(activity)
        fetchComments(activity._id)
    }

    const handleAddComment = async () => {
        if (!newComment.trim() || !selectedActivity || !selectedStudent) return

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('activityId', selectedActivity._id)
            formData.append('studentId', selectedStudent._id)
            formData.append('text', newComment)
            
            // Add reference audio if available
            if (recordedAudio) {
                formData.append('referenceAudio', recordedAudio, 'reference-audio.wav')
            }

            await api.post('/admin/review/comments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            toast.success('Comment added with reference audio')
            setNewComment('')
            setRecordedAudio(null)
            fetchComments(selectedActivity._id)
        } catch (err: any) {
            toast.error('Failed to add comment')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteComment = async (commentId: string) => {
        if (!window.confirm('Delete this comment?')) return

        try {
            await api.delete(`/admin/review/comments/${commentId}`)
            toast.success('Comment deleted')
            if (selectedActivity) {
                fetchComments(selectedActivity._id)
            }
            if (selectedAdmin) {
                fetchAdminComments(selectedAdmin._id)
            }
        } catch (err: any) {
            toast.error('Failed to delete comment')
        }
    }

    const handleUpdateCommentStatus = async (commentId: string, status: string) => {
        try {
            await api.put(`/admin/review/comments/${commentId}`, { status })
            toast.success('Comment status updated')
            if (selectedActivity) {
                fetchComments(selectedActivity._id)
            }
            if (selectedAdmin) {
                fetchAdminComments(selectedAdmin._id)
            }
        } catch (err: any) {
            toast.error('Failed to update comment')
        }
    }

    const playAudio = async (activityId: string) => {
        try {
            const existing = audioElementsRef.current.get(activityId)

            // Toggle pause/resume if already loaded
            if (existing) {
                if (!existing.paused) {
                    existing.pause()
                    setPlayingId(null)
                    return
                }

                await existing.play()
                setPlayingId(activityId)
                return
            }

            // Stop any other playing audio
            audioElementsRef.current.forEach((audio) => {
                audio.pause()
                audio.currentTime = 0
            })

            const res = await api.get(`/activity/history/${activityId}/audio`, {
                responseType: 'blob',
            })
            const audioUrl = URL.createObjectURL(res.data)
            const audio = new Audio(audioUrl)

            audioElementsRef.current.set(activityId, audio)
            setPlayingId(activityId)

            audio.onended = () => {
                setPlayingId(null)
                URL.revokeObjectURL(audioUrl)
                audioElementsRef.current.delete(activityId)
            }

            audio.onerror = () => {
                setPlayingId(null)
                URL.revokeObjectURL(audioUrl)
                audioElementsRef.current.delete(activityId)
                toast.error('Failed to play audio')
            }

            await audio.play()
        } catch (err) {
            setPlayingId(null)
            toast.error('Failed to load audio')
        }
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)
            const chunks: BlobPart[] = []

            recorder.ondataavailable = (e) => chunks.push(e.data)
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/wav' })
                setRecordedAudio(blob)
                stream.getTracks().forEach(track => track.stop())
            }

            recorder.start()
            setMediaRecorder(recorder)
            setIsRecording(true)
            toast.success('Recording started')
        } catch (err) {
            toast.error('Failed to access microphone')
        }
    }

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop()
            setIsRecording(false)
            setMediaRecorder(null)
            toast.success('Recording saved')
        }
    }

    const playRecordedAudio = () => {
        if (recordedAudio) {
            const audioUrl = URL.createObjectURL(recordedAudio)
            const audio = new Audio(audioUrl)
            audio.play()
        }
    }

    const discardRecording = () => {
        setRecordedAudio(null)
        toast.success('Recording discarded')
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

            const res = await api.get(`/admin/review/comments/${commentId}/reference-audio`, {
                responseType: 'blob',
            })
            const audioUrl = URL.createObjectURL(res.data)
            const audio = new Audio(audioUrl)

            audioElementsRef.current.set(commentId, audio)
            setPlayingAudioId(commentId)

            audio.onended = () => {
                setPlayingAudioId(null)
                URL.revokeObjectURL(audioUrl)
                audioElementsRef.current.delete(commentId)
            }

            audio.onerror = () => {
                setPlayingAudioId(null)
                URL.revokeObjectURL(audioUrl)
                audioElementsRef.current.delete(commentId)
                toast.error('Failed to play reference audio')
            }

            await audio.play()
        } catch (err) {
            setPlayingAudioId(null)
            toast.error('Failed to load reference audio')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Review Center</h1>
                    <p className="text-gray-600 mt-1">Review student recordings and admin feedback</p>
                    
                    {/* View Mode Toggle */}
                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={() => setViewMode('students')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                viewMode === 'students'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            <Users size={18} />
                            Review Students
                        </button>
                        <button
                            onClick={() => setViewMode('admins')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                viewMode === 'admins'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            <UserCog size={18} />
                            Review Admins
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Students/Admins List */}
                <div className="md:col-span-1 bg-white rounded-lg shadow-md border border-gray-200 p-4 h-fit">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        {viewMode === 'students' ? 'Students' : 'Admins'}
                    </h2>
                    {loading && (viewMode === 'students' ? !students.length : !admins.length) ? (
                        <p className="text-gray-500 text-sm">Loading...</p>
                    ) : (
                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {viewMode === 'students' ? (
                                students.map((student) => (
                                    <button
                                        key={student._id}
                                        onClick={() => handleSelectStudent(student)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                            selectedStudent?._id === student._id
                                                ? 'bg-blue-100 border-l-4 border-blue-600'
                                                : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        <div className="font-medium text-sm text-gray-900">{student.name}</div>
                                        <div className="text-xs text-gray-500">{student.email}</div>
                                        <div className="flex gap-2 mt-1 text-xs">
                                            <span className="bg-gray-100 px-2 py-1 rounded">{student.activityCount} activities</span>
                                            {student.pendingComments > 0 && (
                                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                                    {student.pendingComments} pending
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                admins.map((admin) => (
                                    <button
                                        key={admin._id}
                                        onClick={() => handleSelectAdmin(admin)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                            selectedAdmin?._id === admin._id
                                                ? 'bg-blue-100 border-l-4 border-blue-600'
                                                : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        <div className="font-medium text-sm text-gray-900">{admin.name}</div>
                                        <div className="text-xs text-gray-500">{admin.email}</div>
                                        <div className="flex gap-2 mt-1 text-xs flex-wrap">
                                            <span className="bg-gray-100 px-2 py-1 rounded">{admin.commentCount} comments</span>
                                            {admin.pendingComments > 0 && (
                                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                                    {admin.pendingComments} pending
                                                </span>
                                            )}
                                            {admin.reviewedComments > 0 && (
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                                    {admin.reviewedComments} reviewed
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Activities List (for students only) */}
                {selectedStudent && viewMode === 'students' && (
                    <div className="md:col-span-1 bg-white rounded-lg shadow-md border border-gray-200 p-4 h-fit">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            {selectedStudent.name}'s Activities
                        </h2>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {activitiesLoading ? (
                                <div className="space-y-2">
                                    {[1,2,3].map((i) => (
                                        <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                activities.map((activity) => (
                                    <button
                                        key={activity._id}
                                        onClick={() => handleSelectActivity(activity)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors border-l-4 ${
                                            selectedActivity?._id === activity._id
                                                ? 'bg-blue-100 border-blue-600'
                                                : 'hover:bg-gray-100 border-transparent'
                                        }`}
                                    >
                                        <div className="font-medium text-sm text-gray-900">{activity.title}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {format(new Date(activity.createdAt), 'MMM dd, HH:mm')}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {activity.commentCount > 0 && (
                                                <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    <MessageSquare size={12} />
                                                    {activity.commentCount}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Activity Details */}
                {selectedActivity && selectedStudent && (
                    <div className="md:col-span-2 space-y-4">
                        {/* Activity Info */}
                        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">{selectedActivity.title}</h3>
                            
                            {/* Text Content */}
                            <div className="mb-4">
                                <h4 className="font-medium text-gray-700 mb-2">Text Content</h4>
                                <p className="text-gray-600 leading-relaxed text-sm">{selectedActivity.textContent}</p>
                            </div>

                            {/* Oral Exam Transcript + AI Comments */}
                            {selectedActivity.activityType === 'oral_exam' && selectedActivity.oralExamSession && (
                                <div className="mb-4">
                                    <h4 className="font-medium text-gray-700 mb-2">Oral Exam Conversation</h4>
                                    <div className="space-y-3 max-h-[240px] overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg p-3">
                                        {selectedActivity.oralExamSession.messages
                                            .filter(msg => msg.role !== 'system')
                                            .map((msg, idx) => (
                                                <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-50 ml-6' : 'bg-green-50 mr-6'}`}>
                                                    <div className={`font-semibold text-sm mb-1 ${msg.role === 'user' ? 'text-blue-700' : 'text-green-700'}`}>
                                                        {msg.role === 'user' ? 'Student' : 'Examiner'}
                                                    </div>
                                                    <div className="text-gray-800 text-sm leading-relaxed">{msg.content}</div>
                                                </div>
                                            ))}
                                    </div>

                                    {selectedActivity.oralExamSession.evaluation && (
                                        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                            <h5 className="font-semibold text-yellow-800 mb-2">AI Comments & Marks</h5>
                                            {selectedActivity.oralExamSession.evaluation.totalScore !== undefined && (
                                                <div className="text-sm text-gray-700 mb-2">
                                                    <span className="font-semibold">Score:</span> {selectedActivity.oralExamSession.evaluation.totalScore}
                                                </div>
                                            )}
                                            {selectedActivity.oralExamSession.evaluation.commentaireGlobal && (
                                                <p className="text-gray-700 text-sm leading-relaxed">
                                                    {selectedActivity.oralExamSession.evaluation.commentaireGlobal}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Audio Player */}
                            {selectedActivity.audioBuffer && (
                                <div className="mb-4">
                                    <h4 className="font-medium text-gray-700 mb-2">Recording</h4>
                                    <button
                                        onClick={() => playAudio(selectedActivity._id)}
                                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        {playingId === selectedActivity._id ? (
                                            <>
                                                <Pause size={20} />
                                                Pause
                                            </>
                                        ) : (
                                            <>
                                                <Play size={20} />
                                                Play Recording
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Scores */}
                            {(selectedActivity.accuracy || selectedActivity.fluency) && (
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {selectedActivity.accuracy && (
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-600">Accuracy</p>
                                            <p className="text-2xl font-bold text-blue-600">{selectedActivity.accuracy}%</p>
                                        </div>
                                    )}
                                    {selectedActivity.fluency && (
                                        <div className="bg-green-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-600">Fluency</p>
                                            <p className="text-2xl font-bold text-green-600">{selectedActivity.fluency}%</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Last Comment Preview */}
                            {selectedActivity.lastComment && (
                                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                                    <p className="text-gray-600 font-medium">Last Comment</p>
                                    <p className="text-gray-700 mt-1">{selectedActivity.lastComment.text}</p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        by {selectedActivity.lastComment.adminName} •{' '}
                                        {format(new Date(selectedActivity.lastComment.createdAt), 'MMM dd, HH:mm')}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Comments Section */}
                        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments ({comments.length})</h3>

                            {/* Comments List */}
                            <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
                                {commentsLoading ? (
                                    <div className="space-y-2">
                                        {[1,2].map((i) => (
                                            <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
                                        ))}
                                    </div>
                                ) : comments.length === 0 ? (
                                    <p className="text-gray-500 text-sm italic">No comments yet</p>
                                ) : (
                                    comments.map((comment) => (
                                        <div
                                            key={comment._id}
                                            className={`p-3 rounded-lg border-l-4 ${
                                                comment.status === 'resolved'
                                                    ? 'bg-green-50 border-green-600'
                                                    : 'bg-gray-50 border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="text-gray-800 text-sm">{comment.text}</p>
                                                    
                                                    {/* Reference Audio Playback */}
                                                    {comment.referenceAudio && (
                                                        <div className="mt-2 mb-2">
                                                            <button
                                                                onClick={() => playReferenceAudio(comment._id)}
                                                                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                                                            >
                                                                {playingAudioId === comment._id ? (
                                                                    <>
                                                                        <Pause size={14} />
                                                                        Pause
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Play size={14} />
                                                                        Reference Audio
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                        <span>{comment.adminId.name}</span>
                                                        <span>•</span>
                                                        <span>{format(new Date(comment.createdAt), 'MMM dd, HH:mm')}</span>
                                                        <span>•</span>
                                                        <span className={`px-2 py-0.5 rounded ${
                                                            comment.status === 'resolved'
                                                                ? 'bg-green-200 text-green-800'
                                                                : 'bg-orange-200 text-orange-800'
                                                        }`}>
                                                            {comment.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 ml-2">
                                                    {comment.status !== 'resolved' && (
                                                        <button
                                                            onClick={() =>
                                                                handleUpdateCommentStatus(comment._id, 'resolved')
                                                            }
                                                            className="text-green-600 hover:text-green-800 transition-colors"
                                                            title="Mark as resolved"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteComment(comment._id)}
                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add Comment */}
                            <div className="space-y-3 border-t border-gray-200 pt-4">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add feedback for the student..."
                                    className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                />
                                
                                {/* Audio Recording Section */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                                        <Mic size={18} className="text-blue-600" />
                                        Reference Audio for Student
                                    </h4>
                                    
                                    {!recordedAudio ? (
                                        <div className="space-y-2">
                                            {!isRecording ? (
                                                <>
                                                    <p className="text-sm text-gray-600">
                                                        Record a reference pronunciation to guide the student's learning
                                                    </p>
                                                    <button
                                                        onClick={startRecording}
                                                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Mic size={20} />
                                                        Start Recording
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2 text-red-600 mb-2">
                                                        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                                                        <span className="font-medium">Recording...</span>
                                                    </div>
                                                    <button
                                                        onClick={stopRecording}
                                                        className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Square size={20} />
                                                        Stop Recording
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="bg-white p-3 rounded border border-green-300">
                                                <p className="text-sm text-gray-700 mb-2">✓ Audio recorded successfully</p>
                                                <button
                                                    onClick={playRecordedAudio}
                                                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                                                >
                                                    <Play size={16} />
                                                    Play Recording
                                                </button>
                                            </div>
                                            <button
                                                onClick={discardRecording}
                                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
                                            >
                                                Discard & Re-record
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim() || loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    {recordedAudio ? 'Add Comment with Reference Audio' : 'Add Comment'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!selectedActivity && selectedStudent && viewMode === 'students' && (
                    <div className="md:col-span-2 bg-white rounded-lg shadow-md border border-gray-200 p-8 flex items-center justify-center">
                        <div className="text-center">
                            <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">Select an activity to review</p>
                        </div>
                    </div>
                )}

                {/* Admin Comments View */}
                {selectedAdmin && viewMode === 'admins' && (
                    <div className="md:col-span-3 space-y-4">
                        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                {selectedAdmin.name}'s Feedback Comments
                            </h2>
                            
                            {commentsLoading ? (
                                <div className="space-y-3">
                                    {[1,2,3].map((i) => (
                                        <div key={i} className="h-24 rounded-lg bg-gray-100 animate-pulse" />
                                    ))}
                                </div>
                            ) : adminComments.length === 0 ? (
                                <div className="text-center py-8">
                                    <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No comments yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {adminComments.map((comment) => (
                                        <div key={comment._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-gray-500">
                                                            For: <span className="font-medium text-gray-700">{comment.studentId?.name}</span>
                                                        </span>
                                                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                            comment.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                                            comment.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {comment.status}
                                                        </span>
                                                    </div>
                                                    {comment.activityId && (
                                                        <div className="text-xs text-gray-500 mb-2">
                                                            Activity: <span className="font-medium">{comment.activityId.title}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteComment(comment._id)}
                                                    className="text-red-500 hover:text-red-700 transition-colors"
                                                    title="Delete comment"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            
                                            <p className="text-gray-700 text-sm mb-2">{comment.text}</p>
                                            
                                            {comment.referenceAudio && (
                                                <div className="mt-2">
                                                    <button
                                                        onClick={() => playReferenceAudio(comment._id)}
                                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                                                    >
                                                        {playingAudioId === comment._id ? (
                                                            <>
                                                                <Pause size={16} />
                                                                Playing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play size={16} />
                                                                Play Reference Audio
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                                <span className="text-xs text-gray-500">
                                                    {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                                                </span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleUpdateCommentStatus(comment._id, 'reviewed')}
                                                        disabled={comment.status === 'reviewed'}
                                                        className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Mark Reviewed
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateCommentStatus(comment._id, 'resolved')}
                                                        disabled={comment.status === 'resolved'}
                                                        className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Mark Resolved
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!selectedStudent && !selectedAdmin && viewMode === 'students' && (
                    <div className="md:col-span-3 bg-white rounded-lg shadow-md border border-gray-200 p-8 flex items-center justify-center">
                        <div className="text-center">
                            <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">Select a student to get started</p>
                        </div>
                    </div>
                )}
                
                {!selectedAdmin && viewMode === 'admins' && (
                    <div className="md:col-span-3 bg-white rounded-lg shadow-md border border-gray-200 p-8 flex items-center justify-center">
                        <div className="text-center">
                            <UserCog size={48} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">Select an admin to review their work</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminReview
