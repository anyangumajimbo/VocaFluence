import { useState, useEffect } from 'react'
import { usersAPI } from '../services/api'
import {
    Users,
    Search,
    Eye,
    UserCheck,
    UserX
} from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
    _id: string
    email: string
    firstName?: string
    lastName?: string
    role: 'student' | 'admin'
    preferredLanguage: string
    createdAt: string
    lastLogin?: string
    isActive: boolean
    stats?: {
        totalSessions: number
        avgScore: number
        currentStreak: number
        maxStreak: number
    }
}

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedRole, setSelectedRole] = useState<string>('')
    const [selectedLanguage, setSelectedLanguage] = useState<string>('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        fetchUsers()
    }, [currentPage, selectedRole, selectedLanguage])

    const fetchUsers = async () => {
        try {
            const params: any = {
                page: currentPage,
                limit: 20
            }

            if (selectedRole) params.role = selectedRole
            if (selectedLanguage) params.language = selectedLanguage

            const response = await usersAPI.getAll(params)
            setUsers(response.data.users)
            setTotalPages(response.data.pagination.pages)
        } catch (error) {
            console.error('Error fetching users:', error)
            toast.error('Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleActive = async (userId: string, isActive: boolean) => {
        try {
            await usersAPI.updateStatus(userId, { isActive: !isActive })
            toast.success(`User ${isActive ? 'deactivated' : 'activated'} successfully`)
            fetchUsers()
        } catch (error) {
            console.error('Error updating user status:', error)
            toast.error('Failed to update user status')
        }
    }

    const filteredUsers = users.filter(user => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase()
        const email = user.email.toLowerCase()
        const search = searchTerm.toLowerCase()
        return fullName.includes(search) || email.includes(search)
    })

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-error-100 text-error-800'
            case 'student':
                return 'bg-primary-100 text-primary-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getLanguageFlag = (language: string) => {
        switch (language) {
            case 'english':
                return '🇺🇸'
            case 'french':
                return '🇫🇷'
            case 'swahili':
                return '🇹🇿'
            default:
                return '🌍'
        }
    }

    const getStatusColor = (isActive: boolean) => {
        return isActive
            ? 'bg-success-100 text-success-800'
            : 'bg-gray-100 text-gray-800'
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
                <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
                <p className="text-gray-600">
                    View and manage user accounts and permissions
                </p>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-field pl-10"
                            />
                        </div>
                    </div>

                    {/* Role Filter */}
                    <div className="flex-shrink-0">
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="input-field"
                        >
                            <option value="">All Roles</option>
                            <option value="student">Student</option>
                            <option value="admin">Admin</option>
                        </select>
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

            {/* Users List */}
            {filteredUsers.length > 0 ? (
                <div className="space-y-4">
                    {filteredUsers.map((user) => (
                        <div key={user._id} className="card">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Users className="h-5 w-5 text-gray-600" />
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-1">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {user.firstName && user.lastName 
                                                    ? `${user.firstName} ${user.lastName}`
                                                    : user.email
                                                }
                                            </h3>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.isActive)}`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            {(user.firstName || user.lastName) && (
                                                <div className="flex items-center">
                                                    <span>{user.email}</span>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center">
                                                <span className="mr-1">{getLanguageFlag(user.preferredLanguage)}</span>
                                                <span className="capitalize">{user.preferredLanguage}</span>
                                            </div>

                                            <div className="flex items-center">
                                                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                                            </div>

                                            {user.lastLogin && (
                                                <div className="flex items-center">
                                                    <span>Last login {new Date(user.lastLogin).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                                        title="View user details"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>

                                    <button
                                        onClick={() => handleToggleActive(user._id, user.isActive)}
                                        className={`p-2 transition-colors ${user.isActive
                                            ? 'text-gray-400 hover:text-error-600'
                                            : 'text-gray-400 hover:text-success-600'
                                            }`}
                                        title={user.isActive ? 'Deactivate user' : 'Activate user'}
                                    >
                                        {user.isActive ? (
                                            <UserX className="h-4 w-4" />
                                        ) : (
                                            <UserCheck className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* User Stats */}
                            {user.stats && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-primary-600">
                                                {user.stats.totalSessions}
                                            </div>
                                            <div className="text-xs text-gray-500">Sessions</div>
                                        </div>

                                        <div className="text-center">
                                            <div className="text-lg font-bold text-success-600">
                                                {user.stats.avgScore}%
                                            </div>
                                            <div className="text-xs text-gray-500">Avg Score</div>
                                        </div>

                                        <div className="text-center">
                                            <div className="text-lg font-bold text-warning-600">
                                                {user.stats.currentStreak}
                                            </div>
                                            <div className="text-xs text-gray-500">Current Streak</div>
                                        </div>

                                        <div className="text-center">
                                            <div className="text-lg font-bold text-primary-600">
                                                {user.stats.maxStreak}
                                            </div>
                                            <div className="text-xs text-gray-500">Best Streak</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                    <p className="text-gray-500">
                        {searchTerm || selectedRole || selectedLanguage
                            ? 'Try adjusting your filters'
                            : 'No users are registered yet'
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

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card text-center">
                    <div className="text-2xl font-bold text-primary-600">
                        {users.length}
                    </div>
                    <p className="text-sm text-gray-500">Total Users</p>
                </div>

                <div className="card text-center">
                    <div className="text-2xl font-bold text-success-600">
                        {users.filter(u => u.isActive).length}
                    </div>
                    <p className="text-sm text-gray-500">Active Users</p>
                </div>

                <div className="card text-center">
                    <div className="text-2xl font-bold text-warning-600">
                        {users.filter(u => u.role === 'student').length}
                    </div>
                    <p className="text-sm text-gray-500">Students</p>
                </div>

                <div className="card text-center">
                    <div className="text-2xl font-bold text-error-600">
                        {users.filter(u => u.role === 'admin').length}
                    </div>
                    <p className="text-sm text-gray-500">Admins</p>
                </div>
            </div>
        </div>
    )
} 