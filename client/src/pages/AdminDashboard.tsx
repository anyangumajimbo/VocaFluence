import { useState, useEffect } from 'react'
import {
    BarChart3,
    FileText,
    TrendingUp,
    Clock,
    Activity,
    Globe,
    Users
} from 'lucide-react'

interface DashboardStats {
    totalUsers: number
    totalSessions: number
    avgScore: number
    activeUsers: number
    languageStats: any[]
    recentActivity: any[]
}

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardStats()
    }, [])

    const fetchDashboardStats = async () => {
        try {
            // In a real app, you'd have a dedicated admin stats endpoint
            // For now, we'll simulate the data
            const mockStats: DashboardStats = {
                totalUsers: 156,
                totalSessions: 1247,
                avgScore: 78.5,
                activeUsers: 89,
                languageStats: [
                    { language: 'english', users: 89, sessions: 567 },
                    { language: 'french', users: 34, sessions: 234 },
                    { language: 'swahili', users: 33, sessions: 446 }
                ],
                recentActivity: [
                    { type: 'practice', user: 'john@example.com', script: 'Basic Greetings', score: 85, time: '2 hours ago' },
                    { type: 'practice', user: 'marie@example.com', script: 'Weather Report', score: 92, time: '3 hours ago' },
                    { type: 'practice', user: 'ahmed@example.com', script: 'Daily Routine', score: 76, time: '4 hours ago' },
                    { type: 'register', user: 'sarah@example.com', time: '5 hours ago' },
                    { type: 'script_upload', user: 'admin@vocfluence.com', script: 'Business Meeting', time: '6 hours ago' }
                ]
            }

            setStats(mockStats)
        } catch (error) {
            console.error('Error fetching dashboard stats:', error)
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
                        {stats?.languageStats.map((stat) => (
                            <div key={stat.language} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Globe className="h-5 w-5 text-gray-400 mr-3" />
                                    <span className="font-medium text-gray-900 capitalize">
                                        {stat.language}
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
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>

                    <div className="space-y-3">
                        {stats?.recentActivity.map((activity, index) => (
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
                                        {activity.type === 'practice' && activity.script && (
                                            <>Practiced "{activity.script}" • Score: {activity.score}%</>
                                        )}
                                        {activity.type === 'register' && 'Registered new account'}
                                        {activity.type === 'script_upload' && activity.script && (
                                            <>Uploaded "{activity.script}"</>
                                        )}
                                    </p>
                                </div>

                                <div className="text-xs text-gray-500">
                                    {activity.time}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="btn-primary flex items-center justify-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Upload Script
                    </button>

                    <button className="btn-secondary flex items-center justify-center">
                        <Users className="h-5 w-5 mr-2" />
                        Manage Users
                    </button>

                    <button className="btn-secondary flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        View Analytics
                    </button>
                </div>
            </div>

            {/* System Health */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Database</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                                Online
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">AI Service</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                                Online
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Email Service</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                                Warning
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">File Storage</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                                Online
                            </span>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Response Time</span>
                            <span className="text-sm font-medium text-gray-900">~120ms</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Uptime</span>
                            <span className="text-sm font-medium text-gray-900">99.9%</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Storage Used</span>
                            <span className="text-sm font-medium text-gray-900">2.4 GB / 10 GB</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Memory Usage</span>
                            <span className="text-sm font-medium text-gray-900">68%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 