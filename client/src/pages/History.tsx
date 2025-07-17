import { useState, useEffect } from 'react'
import { practiceAPI } from '../services/api'
import {
    Clock,
    TrendingUp,
    Target,
    Calendar,
    Search,
    Play,
    Eye,
    BarChart3
} from 'lucide-react'
import { format } from 'date-fns'

interface PracticeSession {
    _id: string
    scriptId: {
        _id: string
        title: string
        language: string
    }
    score: number
    accuracy: number
    fluency: number
    feedbackComments: string[]
    duration: number
    wordsPerMinute?: number
    timestamp: string
}

export const History: React.FC = () => {
    const [sessions, setSessions] = useState<PracticeSession[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedLanguage, setSelectedLanguage] = useState<string>('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        fetchHistory()
        fetchStats()
    }, [currentPage, selectedLanguage])

    const fetchHistory = async () => {
        try {
            const params: any = {
                page: currentPage,
                limit: 10
            }

            const response = await practiceAPI.getHistory(params)
            setSessions(response.data.sessions)
            setTotalPages(response.data.pagination.pages)
        } catch (error) {
            console.error('Error fetching history:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await practiceAPI.getStats()
            setStats(response.data.stats)
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const filteredSessions = sessions.filter(session =>
        session.scriptId.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-success-600'
        if (score >= 60) return 'text-warning-600'
        return 'text-error-600'
    }

    const getScoreBadge = (score: number) => {
        if (score >= 80) return 'bg-success-100 text-success-800'
        if (score >= 60) return 'bg-warning-100 text-warning-800'
        return 'bg-error-100 text-error-800'
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
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
                <h1 className="text-2xl font-bold text-gray-900">Practice History</h1>
                <p className="text-gray-600">
                    Review your past practice sessions and track your progress
                </p>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="card">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="h-5 w-5 text-primary-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.totalSessions}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-success-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Avg Score</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {Math.round(stats.avgScore || 0)}%
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                                    <Target className="h-5 w-5 text-warning-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Avg Accuracy</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {Math.round(stats.avgAccuracy || 0)}%
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-primary-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Avg Fluency</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {Math.round(stats.avgFluency || 0)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search sessions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-field pl-10"
                            />
                        </div>
                    </div>

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
                </div>
            </div>

            {/* Sessions List */}
            {filteredSessions.length > 0 ? (
                <div className="space-y-4">
                    {filteredSessions.map((session) => (
                        <div key={session._id} className="card">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {session.scriptId.title}
                                        </h3>
                                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getScoreBadge(session.score)}`}>
                                            {session.score}%
                                        </span>
                                    </div>

                                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            {format(new Date(session.timestamp), 'MMM dd, yyyy HH:mm')}
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="h-4 w-4 mr-1" />
                                            {formatDuration(session.duration)}
                                        </div>
                                        <div className="flex items-center">
                                            <Target className="h-4 w-4 mr-1" />
                                            {session.scriptId.language}
                                        </div>
                                    </div>

                                    {/* Score Breakdown */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <div className={`text-lg font-bold ${getScoreColor(session.accuracy)}`}>
                                                {session.accuracy}%
                                            </div>
                                            <div className="text-xs text-gray-500">Accuracy</div>
                                        </div>

                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <div className={`text-lg font-bold ${getScoreColor(session.fluency)}`}>
                                                {session.fluency}%
                                            </div>
                                            <div className="text-xs text-gray-500">Fluency</div>
                                        </div>

                                        {session.wordsPerMinute && (
                                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                <div className="text-lg font-bold text-primary-600">
                                                    {session.wordsPerMinute}
                                                </div>
                                                <div className="text-xs text-gray-500">WPM</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Feedback Comments */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-gray-700">AI Feedback</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                            {session.feedbackComments.map((comment, index) => (
                                                <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                                    {comment}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 ml-4">
                                    <button
                                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                                        title="View details"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>

                                    <button
                                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                                        title="Play recording"
                                    >
                                        <Play className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center py-12">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No practice sessions found</h3>
                    <p className="text-gray-500">
                        {searchTerm || selectedLanguage
                            ? 'Try adjusting your filters'
                            : 'Start practicing to see your history here'
                        }
                    </p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
} 