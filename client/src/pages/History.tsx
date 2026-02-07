import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import {
    Clock,
    TrendingUp,
    Target,
    Search,
    Play,
    Pause,
    Volume2,
    BarChart3,
    Filter,
    Book,
    Mic,
    Volume,
    Loader,
    Repeat2,
    PenTool
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

type ActivityType = 'practice' | 'oral_exam' | 'vocabulary' | 'listening' | 'grammar'

interface Activity {
    _id: string
    activityType: ActivityType
    title: string
    description?: string
    textContent?: string
    score?: number
    accuracy?: number
    fluency?: number
    duration: number
    transcript?: string
    feedback?: string
    relatedId?: string
    createdAt: string
}

interface GrammarHistory {
    _id: string
    topicId: string
    topicName: string
    level: string
    scores: Record<string, number>
    avgScore: number
    completedAt: string
    createdAt: string
}

interface OralExamEvaluation {
    coherence?: number
    vocabulaire?: number
    grammaire?: number
    prononciation?: number
    totalScore?: number
    pointsForts?: string[]
    axesAmelioration?: string[]
    commentaireGlobal?: string
}

interface OralExamMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
}

interface OralExamSession {
    _id: string
    question: string
    messages: OralExamMessage[]
    evaluation?: OralExamEvaluation
    createdAt: string
}

interface ActivityStats {
    totalActivities: number
    totalDuration: number
    avgScore?: number
    avgAccuracy?: number
    avgFluency?: number
}

interface CategoryCount {
    practice?: { count: number; lastActivity: string }
    oral_exam?: { count: number; lastActivity: string }
    vocabulary?: { count: number; lastActivity: string }
    listening?: { count: number; lastActivity: string }
}

export const History: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>([])
    const [grammarHistory, setGrammarHistory] = useState<GrammarHistory[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedType, setSelectedType] = useState<ActivityType | 'all'>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [stats, setStats] = useState<ActivityStats | null>(null)
    const [categories, setCategories] = useState<CategoryCount | null>(null)
    const [playingId, setPlayingId] = useState<string | null>(null)
    const [audioLoading, setAudioLoading] = useState<string | null>(null)
    const [recordingCounts, setRecordingCounts] = useState<Record<string, number>>({})
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [showOralHistory, setShowOralHistory] = useState(false)
    const [oralSession, setOralSession] = useState<OralExamSession | null>(null)
    const [oralLoading, setOralLoading] = useState(false)

    const ACTIVITY_TYPE_LABELS: Record<ActivityType, { label: string; icon: any; color: string }> = {
        practice: { label: 'Practice', icon: Book, color: 'bg-blue-100 text-blue-800' },
        oral_exam: { label: 'Oral Exam', icon: Mic, color: 'bg-purple-100 text-purple-800' },
        vocabulary: { label: 'Vocabulary', icon: Volume, color: 'bg-green-100 text-green-800' },
        listening: { label: 'Listening', icon: Volume2, color: 'bg-orange-100 text-orange-800' },
        grammar: { label: 'Grammar', icon: PenTool, color: 'bg-indigo-100 text-indigo-800' }
    }

    useEffect(() => {
        fetchActivities()
        fetchGrammarHistory()
        fetchStats()
        fetchCategories()
    }, [currentPage, selectedType])

    const fetchActivities = async () => {
        try {
            setLoading(true)
            const params: any = {
                limit: 10,
                skip: (currentPage - 1) * 10
            }

            if (selectedType !== 'all') {
                params.type = selectedType
            }

            const response = await api.get('/activity/history', { params })
            setActivities(response.data.activities)
            setTotalPages(response.data.pagination.pages)

            // Fetch recording counts for each activity title
            const counts: Record<string, number> = {}
            for (const activity of response.data.activities) {
                try {
                    const countResponse = await api.get(
                        `/activity/title-count/${encodeURIComponent(activity.title)}`
                    )
                    counts[activity.title] = countResponse.data.count
                } catch (err) {
                    counts[activity.title] = 0
                }
            }
            setRecordingCounts(counts)
        } catch (error) {
            console.error('Error fetching activities:', error)
            toast.error('Failed to fetch history')
        } finally {
            setLoading(false)
        }
    }

    const fetchGrammarHistory = async () => {
        try {
            const params: any = {
                limit: 10,
                skip: (currentPage - 1) * 10
            }

            const response = await api.get('/grammar/history', { params })
            if (response.data.data.history) {
                setGrammarHistory(response.data.data.history)
            }
        } catch (error) {
            console.error('Error fetching grammar history:', error)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await api.get('/activity/stats')
            setStats(response.data.stats)
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const fetchCategories = async () => {
        try {
            const response = await api.get('/activity/categories')
            setCategories(response.data.categories)
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const playAudio = async (activityId: string) => {
        try {
            setAudioLoading(activityId)
            const response = await api.get(`/activity/history/${activityId}/audio`, {
                responseType: 'blob'
            })

            const audioBlob = new Blob([response.data], { type: 'audio/mpeg' })
            const audioUrl = URL.createObjectURL(audioBlob)

            if (audioRef.current) {
                audioRef.current.src = audioUrl
                audioRef.current.play()
                setPlayingId(activityId)
            }
        } catch (error) {
            console.error('Error playing audio:', error)
            toast.error('Failed to load audio')
        } finally {
            setAudioLoading(null)
        }
    }

    const openOralHistory = async (relatedId?: string) => {
        if (!relatedId) return
        try {
            setOralLoading(true)
            const response = await api.get(`/oral-exam/session/${relatedId}`)
            setOralSession(response.data.session)
            setShowOralHistory(true)
        } catch (error) {
            console.error('Error fetching oral exam session:', error)
            toast.error('Failed to load oral exam history')
        } finally {
            setOralLoading(false)
        }
    }

    const filteredActivities = activities.filter(activity =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getGrammarAsActivities = (): Activity[] => {
        return grammarHistory.map(grammar => ({
            _id: grammar._id,
            activityType: 'grammar',
            title: grammar.topicName,
            score: grammar.avgScore,
            duration: 0,
            createdAt: grammar.completedAt || grammar.createdAt,
            description: `Level: ${grammar.level}`
        })) as Activity[]
    }

    const allActivitiesWithGrammar = selectedType === 'all' 
        ? [...filteredActivities, ...getGrammarAsActivities()]
        : selectedType === 'grammar'
        ? getGrammarAsActivities().filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()))
        : filteredActivities

    const getScoreColor = (score?: number) => {
        if (!score) return 'text-gray-600'
        if (score >= 80) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getCategoryCount = (type: ActivityType): number => {
        if (type === 'grammar') {
            return grammarHistory.length
        }
        return categories?.[type]?.count || 0
    }

    if (loading && !activities.length) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Hidden audio element for playback */}
            <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Learning History</h1>
                <p className="text-gray-600">
                    Review your practice sessions, oral exams, and learning activities
                </p>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <BarChart3 className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.totalActivities}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <TrendingUp className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.avgScore ? Math.round(stats.avgScore) : 0}%
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Target className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Avg Accuracy</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.avgAccuracy ? Math.round(stats.avgAccuracy) : 0}%
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Clock className="h-6 w-6 text-purple-500" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Time</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatDuration(stats.totalDuration || 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Tabs */}
            {categories && (
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => {
                                setSelectedType('all')
                                setCurrentPage(1)
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                selectedType === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All ({(stats?.totalActivities || 0) + grammarHistory.length})
                        </button>
                        {Object.entries(ACTIVITY_TYPE_LABELS).map(([type, { label }]) => (
                            <button
                                key={type}
                                onClick={() => {
                                    setSelectedType(type as ActivityType)
                                    setCurrentPage(1)
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                    selectedType === type
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {label} ({getCategoryCount(type as ActivityType)})
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-gray-600" />
                    <h3 className="font-medium text-gray-900">Search</h3>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by title or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Activities List */}
            {allActivitiesWithGrammar.length > 0 ? (
                <div className="space-y-4">
                    {allActivitiesWithGrammar.map((activity) => {
                        const typeInfo = ACTIVITY_TYPE_LABELS[activity.activityType]
                        const Icon = typeInfo.icon
                        const titleCount = recordingCounts[activity.title] || 0
                        const hasMarks = activity.score !== undefined
                        const hasRecording = activity.activityType === 'practice' && activity.score !== undefined

                        return (
                            <div key={activity._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                                {/* Title Section */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {activity.title}
                                            </h3>
                                            <span className={`inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full ${typeInfo.color}`}>
                                                {typeInfo.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Text Content (Always Show) */}
                                {activity.textContent && (
                                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-xs font-medium text-blue-900 mb-2">📖 Text Content:</p>
                                        <p className="text-sm text-blue-800 leading-relaxed">
                                            {activity.textContent}
                                        </p>
                                    </div>
                                )}

                                {/* Grammar-specific display */}
                                {activity.activityType === 'grammar' && activity.description && (
                                    <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                                        <p className="text-sm font-medium text-indigo-900 mb-2">📚 Level:</p>
                                        <p className="text-sm text-indigo-800">
                                            {activity.description}
                                        </p>
                                    </div>
                                )}

                                {/* Recording Details (Only if has recording) */}
                                {hasMarks && (
                                    <>
                                        {/* Marks, Date, Recording Count */}
                                        <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                            <div className={`grid ${activity.activityType === 'grammar' ? 'grid-cols-2' : 'grid-cols-3'} gap-4`}>
                                                {/* Score/Marks */}
                                                <div className="text-center">
                                                    <div className={`text-2xl font-bold ${getScoreColor(activity.score)}`}>
                                                        {activity.score}%
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1">Marks</div>
                                                </div>

                                                {/* Date & Time */}
                                                <div className={`text-center ${activity.activityType === 'grammar' ? '' : 'border-l border-r border-gray-300'}`}>
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {format(new Date(activity.createdAt), 'MMM dd, yyyy')}
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        {format(new Date(activity.createdAt), 'HH:mm')}
                                                    </div>
                                                </div>

                                                {/* Number of Times Recording - Only for non-grammar */}
                                                {activity.activityType !== 'grammar' && (
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-purple-600 flex items-center justify-center gap-1">
                                                            <Repeat2 className="h-5 w-5" />
                                                            {titleCount}
                                                        </div>
                                                        <div className="text-xs text-gray-600 mt-1">
                                                            {titleCount === 1 ? 'Recording' : 'Recordings'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Score Breakdown */}
                                        {(activity.accuracy !== undefined || activity.fluency !== undefined) && (
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                {activity.accuracy !== undefined && (
                                                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                                                        <div className={`text-lg font-bold ${getScoreColor(activity.accuracy)}`}>
                                                            {activity.accuracy}%
                                                        </div>
                                                        <div className="text-xs text-gray-600">Accuracy</div>
                                                    </div>
                                                )}
                                                {activity.fluency !== undefined && (
                                                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                                                        <div className={`text-lg font-bold ${getScoreColor(activity.fluency)}`}>
                                                            {activity.fluency}%
                                                        </div>
                                                        <div className="text-xs text-gray-600">Fluency</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Play Recording Button - MOST IMPORTANT */}
                                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                                            {hasRecording && (
                                                <button
                                                    onClick={() => playAudio(activity._id)}
                                                    disabled={audioLoading === activity._id}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold"
                                                >
                                                    {audioLoading === activity._id ? (
                                                        <Loader className="h-4 w-4 animate-spin" />
                                                    ) : playingId === activity._id ? (
                                                        <Pause className="h-4 w-4" />
                                                    ) : (
                                                        <Play className="h-4 w-4" />
                                                    )}
                                                    {playingId === activity._id ? 'Playing...' : '🎤 Play Recording'}
                                                </button>
                                            )}

                                            {activity.activityType === 'oral_exam' && (
                                                <button
                                                    onClick={() => openOralHistory(activity.relatedId)}
                                                    disabled={oralLoading}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-semibold"
                                                >
                                                    {oralLoading ? (
                                                        <Loader className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Mic className="h-4 w-4" />
                                                    )}
                                                    View Conversation
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                    <p className="text-gray-600">
                        {searchTerm || selectedType !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Start practicing, taking exams, or learning grammar to see your history here'
                        }
                    </p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>

                    <span className="text-sm text-gray-600 font-medium">
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Oral Exam History Modal */}
            {showOralHistory && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-2xl max-h-[80vh] overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800">Conversation History</h3>
                            <button
                                className="text-gray-600 hover:text-gray-800"
                                onClick={() => setShowOralHistory(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto" style={{ maxHeight: '65vh' }}>
                            {oralSession ? (
                                <div className="space-y-4">
                                    <div className="text-sm text-gray-600">
                                        <span className="font-semibold">Sujet:</span> {oralSession.question}
                                    </div>

                                    <div className="space-y-3">
                                        {oralSession.messages
                                            .filter(msg => msg.role !== 'system')
                                            .map((msg, idx) => (
                                                <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-50 ml-8' : 'bg-green-50 mr-8'}`}>
                                                    <div className={`font-semibold text-base mb-1 ${msg.role === 'user' ? 'text-blue-700' : 'text-green-700'}`}>
                                                        {msg.role === 'user' ? 'You' : 'Examiner'}:
                                                    </div>
                                                    <div className="text-gray-800 text-base md:text-lg leading-relaxed">{msg.content}</div>
                                                </div>
                                            ))}
                                    </div>

                                    {oralSession.evaluation && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <div className="font-semibold text-yellow-800 mb-2">Evaluation</div>
                                            {oralSession.evaluation.totalScore !== undefined && (
                                                <div className="text-sm text-gray-700 mb-2">
                                                    <span className="font-semibold">Score:</span> {oralSession.evaluation.totalScore}
                                                </div>
                                            )}
                                            {oralSession.evaluation.commentaireGlobal && (
                                                <p className="text-gray-700 leading-relaxed">{oralSession.evaluation.commentaireGlobal}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic text-center">No conversation history yet</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default History
