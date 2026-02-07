import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import {
    FileText,
    TrendingUp,
    Clock,
    Activity,
    Globe,
    Users
} from 'lucide-react'
import toast from 'react-hot-toast'

interface DashboardStats {
    totalUsers: number
    totalSessions: number
    avgScore: number
    activeUsers: number
}

interface LanguageDistribution {
    language: string
    users: number
    sessions: number
}

interface RecentActivityItem {
    type: string
    user: string
    firstName?: string
    lastName?: string
    description: string
    time: string
}

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [languageStats, setLanguageStats] = useState<LanguageDistribution[]>([])
    const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchDashboardStats()
    }, [])

    const fetchDashboardStats = async () => {
        try {
            const response = await api.get('/users/admin/dashboard')
            setStats(response.data.stats)
            setLanguageStats(response.data.languageDistribution || [])
            setRecentActivity(response.data.recentActivity || [])
        } catch (error) {
            console.error('Error fetching dashboard stats:', error)
            toast.error('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'practice':
                return <Activity className="h-4 w-4 text-success-600" />
            case 'register':
                return <Users className="h-4 w-4 text-primary-600" />
            case 'script_upload':
                return <FileText className="h-4 w-4 text-warning-600" />
            default:
                return <Activity className="h-4 w-4 text-gray-600" />
        }
    }

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'practice':
                return 'bg-success-50 border-success-200'
            case 'register':
                return 'bg-primary-50 border-primary-200'
            case 'script_upload':
                return 'bg-warning-50 border-warning-200'
            default:
                return 'bg-gray-50 border-gray-200'
        }
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
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">
                    Overview of system usage and user activity
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary-600" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats?.totalUsers || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                                <Activity className="h-5 w-5 text-success-600" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats?.totalSessions || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-warning-600" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Avg Score</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats?.avgScore || 0}%
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
                            <p className="text-sm font-medium text-gray-500">Active Users</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats?.activeUsers || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Language Distribution */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Language Distribution</h2>

                    <div className="space-y-4">
                        {languageStats.length > 0 ? (
                            languageStats.map((stat) => (
                                <div key={stat.language} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Globe className="h-5 w-5 text-gray-400 mr-3" />
                                        <span className="font-medium text-gray-900 capitalize">
                                            {stat.language === 'english' && '🇺🇸'}
                                            {stat.language === 'french' && '🇫🇷'}
                                            {stat.language === 'swahili' && '🇹🇿'}
                                            {' '}{stat.language}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-900">
                                            {stat.users} users
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {stat.sessions} sessions
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm">No language data available</p>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>

                    <div className="space-y-3">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center p-3 rounded-lg border ${getActivityColor(activity.type)}`}
                                >
                                    <div className="flex-shrink-0 mr-3">
                                        {getActivityIcon(activity.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">
                                            {activity.user}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {activity.description}
                                        </p>
                                    </div>

                                    <div className="flex-shrink-0 ml-3 text-xs text-gray-500">
                                        {activity.time}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm">No recent activity</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => navigate('/admin/scripts')}
                        className="btn-primary flex items-center justify-center hover:bg-primary-700 transition-colors duration-200"
                    >
                        <FileText className="h-5 w-5 mr-2" />
                        Upload Script
                    </button>

                    <button
                        onClick={() => navigate('/admin/users')}
                        className="btn-secondary flex items-center justify-center hover:bg-gray-300 transition-colors duration-200"
                    >
                        <Users className="h-5 w-5 mr-2" />
                        Manage Users
                    </button>

                    <button
                        onClick={() => navigate('/admin/grammar')}
                        className="btn-secondary flex items-center justify-center hover:bg-gray-300 transition-colors duration-200"
                    >
                        <Globe className="h-5 w-5 mr-2" />
                        Grammar Lessons
                    </button>
                </div>
            </div>
        </div>
    )
} 