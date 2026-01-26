import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import {
    Clock,
    TrendingUp,
    Target,
    Calendar,
    Search,
    Play,
    Pause,
    Volume2,
    Eye,
    BarChart3,
    Filter,
    Book,
    Mic,
    Volume,
    Loader
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

type ActivityType = 'practice' | 'oral_exam' | 'vocabulary' | 'listening'

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
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedType, setSelectedType] = useState<ActivityType | 'all'>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [stats, setStats] = useState<ActivityStats | null>(null)
    const [categories, setCategories] = useState<CategoryCount | null>(null)
    const [playingId, setPlayingId] = useState<string | null>(null)
    const [audioLoading, setAudioLoading] = useState<string | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const ACTIVITY_TYPE_LABELS: Record<ActivityType, { label: string; icon: any; color: string }> = {
        practice: { label: 'Practice', icon: Book, color: 'bg-blue-100 text-blue-800' },
        oral_exam: { label: 'Oral Exam', icon: Mic, color: 'bg-purple-100 text-purple-800' },
        vocabulary: { label: 'Vocabulary', icon: Volume, color: 'bg-green-100 text-green-800' },
        listening: { label: 'Listening', icon: Volume2, color: 'bg-orange-100 text-orange-800' }
    }

    useEffect(() => {
        fetchActivities()
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
        } catch (error) {
            console.error('Error fetching activities:', error)
            toast.error('Failed to fetch history')
        } finally {
            setLoading(false)
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

    const filteredActivities = activities.filter(activity =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getScoreColor = (score?: number) => {
        if (!score) return 'text-gray-600'
        if (score >= 80) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getScoreBadge = (score?: number) => {
        if (!score) return 'bg-gray-100 text-gray-800'
        if (score >= 80) return 'bg-green-100 text-green-800'
        if (score >= 60) return 'bg-yellow-100 text-yellow-800'
        return 'bg-red-100 text-red-800'
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getCategoryCount = (type: ActivityType): number => {
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
                            All ({stats?.totalActivities || 0})
                        </button>
                        {Object.entries(ACTIVITY_TYPE_LABELS).map(([type, { label, color }]) => (
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
            {filteredActivities.length > 0 ? (
                <div className="space-y-4">
                    {filteredActivities.map((activity) => {
                        const typeInfo = ACTIVITY_TYPE_LABELS[activity.activityType]
                        const Icon = typeInfo.icon

                        return (
                            <div key={activity._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
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

                                        {activity.description && (
                                            <p className="text-sm text-gray-600 mt-2">
                                                {activity.description}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-3">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {formatDuration(activity.duration)}
                                            </div>
                                        </div>
                                    </div>

                                    {activity.score !== undefined && (
                                        <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getScoreBadge(activity.score)}`}>
                                            {activity.score}%
                                        </div>
                                    )}
                                </div>

                                {/* Score Breakdown */}
                                {(activity.score !== undefined || activity.accuracy !== undefined || activity.fluency !== undefined) && (
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {activity.score !== undefined && (
                                            <div className="bg-gray-50 p-3 rounded-lg text-center">
                                                <div className={`text-lg font-bold ${getScoreColor(activity.score)}`}>
                                                    {activity.score}%
                                                </div>
                                                <div className="text-xs text-gray-600">Score</div>
                                            </div>
                                        )}
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

                                {/* Text Content Preview */}
                                {activity.textContent && (
                                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-xs font-medium text-blue-900 mb-2">Text Content:</p>
                                        <p className="text-sm text-blue-800 line-clamp-3">
                                            {activity.textContent}
                                        </p>
                                    </div>
                                )}

                                {/* Transcript */}
                                {activity.transcript && (
                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="text-xs font-medium text-gray-700 mb-2">Your Transcript:</p>
                                        <p className="text-sm text-gray-700 line-clamp-2">
                                            {activity.transcript}
                                        </p>
                                    </div>
                                )}

                                {/* Feedback */}
                                {activity.feedback && (
                                    <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <p className="text-xs font-medium text-yellow-900 mb-2">AI Feedback:</p>
                                        <p className="text-sm text-yellow-800 line-clamp-2">
                                            {activity.feedback}
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => playAudio(activity._id)}
                                        disabled={audioLoading === activity._id}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {audioLoading === activity._id ? (
                                            <Loader className="h-4 w-4 animate-spin" />
                                        ) : playingId === activity._id ? (
                                            <Pause className="h-4 w-4" />
                                        ) : (
                                            <Play className="h-4 w-4" />
                                        )}
                                        {playingId === activity._id ? 'Playing...' : 'Play Recording'}
                                    </button>
                                </div>
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
                            : 'Start practicing or taking exams to see your history here'
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
        </div>
    )
}

export default History
