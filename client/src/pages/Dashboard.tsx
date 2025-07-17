import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usersAPI } from '../services/api'
import {
    BarChart3,
    Mic,
    BookOpen,
    TrendingUp,
    Calendar,
    Clock,
    Award
} from 'lucide-react'
import { format } from 'date-fns'

interface DashboardData {
    recentSessions: any[]
    totalSessions: number
    avgScore: number
    avgAccuracy: number
    avgFluency: number
    todaySessions: number
    weeklySessions: number
    weeklyAvg: number
}

export const Dashboard: React.FC = () => {
    const { user } = useAuth()
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await usersAPI.getDashboard()
                setDashboardData(response.data.dashboard)
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

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
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.email}!
                </h1>
                <p className="text-gray-600">
                    Ready to improve your {user?.preferredLanguage} fluency?
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                                {dashboardData?.totalSessions || 0}
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
                            <p className="text-sm font-medium text-gray-500">Average Score</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {Math.round(dashboardData?.avgScore || 0)}%
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-warning-600" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Today's Sessions</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {dashboardData?.todaySessions || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                <Award className="h-5 w-5 text-primary-600" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Weekly Average</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {dashboardData?.weeklyAvg || 0}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                    to="/practice"
                    className="card-hover group"
                >
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                                <Mic className="h-6 w-6 text-primary-600" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                                Start Practice
                            </h3>
                            <p className="text-sm text-gray-500">
                                Record your voice and get AI feedback
                            </p>
                        </div>
                    </div>
                </Link>

                <Link
                    to="/scripts"
                    className="card-hover group"
                >
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center group-hover:bg-success-200 transition-colors">
                                <BookOpen className="h-6 w-6 text-success-600" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-success-600 transition-colors">
                                Browse Scripts
                            </h3>
                            <p className="text-sm text-gray-500">
                                Find new content to practice with
                            </p>
                        </div>
                    </div>
                </Link>

                <Link
                    to="/history"
                    className="card-hover group"
                >
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center group-hover:bg-warning-200 transition-colors">
                                <Clock className="h-6 w-6 text-warning-600" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-warning-600 transition-colors">
                                View History
                            </h3>
                            <p className="text-sm text-gray-500">
                                Review your past practice sessions
                            </p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Recent Sessions */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
                    <Link
                        to="/history"
                        className="text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                        View all
                    </Link>
                </div>

                {dashboardData?.recentSessions && dashboardData.recentSessions.length > 0 ? (
                    <div className="space-y-4">
                        {dashboardData.recentSessions.map((session: any) => (
                            <div
                                key={session._id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                        <Mic className="h-5 w-5 text-primary-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-900">
                                            {session.scriptId?.title || 'Unknown Script'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {format(new Date(session.timestamp), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {session.score}%
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {session.accuracy}% accuracy
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mic className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No practice sessions yet</p>
                        <Link
                            to="/practice"
                            className="btn-primary mt-4 inline-flex items-center"
                        >
                            Start Your First Practice
                        </Link>
                    </div>
                )}
            </div>

            {/* Practice Schedule */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Practice Schedule</h2>
                    <Link
                        to="/profile"
                        className="text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                        Edit
                    </Link>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Frequency:</span>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                            {user?.schedule?.frequency || 'Not set'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Reminder Time:</span>
                        <span className="text-sm font-medium text-gray-900">
                            {user?.schedule?.reminderTime || 'Not set'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Preferred Language:</span>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                            {user?.preferredLanguage}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
} 