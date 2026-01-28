import { useState, useEffect } from 'react'
import { usersAPI } from '../services/api'
import {
    Users,
    Search,
    Eye,
    UserCheck,
    UserX,
    X,
    Mail,
    Calendar,
    Globe,
    Award,
    TrendingUp,
    Clock,
    Target
} from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
    _id: string
    email: string
    firstName?: string
    lastName?: string
    role: 'student' | 'admin'
    preferredLanguages?: string[]
    preferredLanguage?: string
    createdAt: string
    lastLogin?: string
    isActive: boolean
    status?: string
    stats?: {
        totalSessions: number
        avgScore: number
        currentStreak: number
        maxStreak: number
    }
}

interface DetailedUser extends User {
    lastPracticeDate?: string
    totalPracticeSessions?: number
    totalOralSessions?: number
    averageScore?: number
    streakDays?: number
    longestStreak?: number
}

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedRole, setSelectedRole] = useState<string>('')
    const [selectedLanguage, setSelectedLanguage] = useState<string>('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [selectedUser, setSelectedUser] = useState<DetailedUser | null>(null)
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [loadingDetails, setLoadingDetails] = useState(false)

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
            const newStatus = isActive ? 'inactive' : 'active'
            await usersAPI.updateStatus(userId, { status: newStatus })
            toast.success(`User ${isActive ? 'deactivated' : 'activated'} successfully`)
            fetchUsers()
            if (selectedUser && selectedUser._id === userId) {
                setSelectedUser({ ...selectedUser, isActive: !isActive })
            }
        } catch (error) {
            console.error('Error updating user status:', error)
            toast.error('Failed to update user status')
        }
    }

    const handleViewUser = async (userId: string) => {
        setLoadingDetails(true)
        setViewModalOpen(true)
        try {
            const response = await usersAPI.getById(userId)
            setSelectedUser(response.data.user)
        } catch (error) {
            console.error('Error fetching user details:', error)
            toast.error('Failed to load user details')
            setViewModalOpen(false)
        } finally {
            setLoadingDetails(false)
        }
    }

    const closeModal = () => {
        setViewModalOpen(false)
        setSelectedUser(null)
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
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 w-full sm:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-field pl-10 w-full"
                            />
                        </div>
                    </div>

                    {/* Role Filter */}
                    <div className="w-full sm:w-auto sm:flex-shrink-0">
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="input-field w-full"
                        >
                            <option value="">All Roles</option>
                            <option value="student">Student</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {/* Language Filter */}
                    <div className="w-full sm:w-auto sm:flex-shrink-0">
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="input-field w-full"
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
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-start sm:items-center space-x-4 flex-1 min-w-0">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Users className="h-5 w-5 text-gray-600" />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                                {user.firstName && user.lastName 
                                                    ? `${user.firstName} ${user.lastName}`
                                                    : user.email
                                                }
                                            </h3>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getRoleColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(user.isActive)}`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                                            {(user.firstName || user.lastName) && (
                                                <div className="flex items-center truncate">
                                                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                                    <span className="truncate">{user.email}</span>
                                                </div>
                                            )}
                                            
                                            {(user.preferredLanguage || user.preferredLanguages) && (
                                                <div className="flex items-center whitespace-nowrap">
                                                    <span className="mr-1">{getLanguageFlag(user.preferredLanguage || user.preferredLanguages?.[0] || 'english')}</span>
                                                    <span className="capitalize">{user.preferredLanguage || user.preferredLanguages?.join(', ') || 'Not set'}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center whitespace-nowrap">
                                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                                <span className="hidden sm:inline">Joined </span>
                                                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                                            </div>

                                            {user.lastLogin && (
                                                <div className="flex items-center whitespace-nowrap">
                                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                                    <span className="hidden sm:inline">Last login </span>
                                                    <span>{new Date(user.lastLogin).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end sm:justify-start space-x-2 sm:space-x-3 flex-shrink-0">
                                    <button
                                        onClick={() => handleViewUser(user._id)}
                                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-100"
                                        title="View user details"
                                    >
                                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </button>

                                    <button
                                        onClick={() => handleToggleActive(user._id, user.isActive)}
                                        className={`p-2 transition-colors rounded-lg ${user.isActive
                                            ? 'text-gray-400 hover:text-error-600 hover:bg-error-50'
                                            : 'text-gray-400 hover:text-success-600 hover:bg-success-50'
                                            }`}
                                        title={user.isActive ? 'Deactivate user' : 'Activate user'}
                                    >
                                        {user.isActive ? (
                                            <UserX className="h-4 w-4 sm:h-5 sm:w-5" />
                                        ) : (
                                            <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card text-center">
                    <div className="text-xl sm:text-2xl font-bold text-primary-600">
                        {users.length}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">Total Users</p>
                </div>

                <div className="card text-center">
                    <div className="text-xl sm:text-2xl font-bold text-success-600">
                        {users.filter(u => u.isActive).length}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">Active Users</p>
                </div>

                <div className="card text-center">
                    <div className="text-xl sm:text-2xl font-bold text-warning-600">
                        {users.filter(u => u.role === 'student').length}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">Students</p>
                </div>

                <div className="card text-center">
                    <div className="text-xl sm:text-2xl font-bold text-error-600">
                        {users.filter(u => u.role === 'admin').length}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">Admins</p>
                </div>
            </div>

            {/* User Detail Modal */}
            {viewModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {loadingDetails ? (
                            <div className="flex items-center justify-center p-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                            </div>
                        ) : selectedUser ? (
                            <>
                                {/* Modal Header */}
                                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                                    <button
                                        onClick={closeModal}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* Modal Content */}
                                <div className="p-6 space-y-6">
                                    {/* User Info Section */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center space-x-4 mb-4">
                                            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                                                <Users className="h-8 w-8 text-primary-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-bold text-gray-900">
                                                    {selectedUser.firstName && selectedUser.lastName
                                                        ? `${selectedUser.firstName} ${selectedUser.lastName}`
                                                        : 'No name provided'}
                                                </h3>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(selectedUser.role)}`}>
                                                        {selectedUser.role}
                                                    </span>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedUser.isActive)}`}>
                                                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <Mail className="h-4 w-4" />
                                                <span>{selectedUser.email}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <Calendar className="h-4 w-4" />
                                                <span>Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {selectedUser.lastLogin && (
                                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                    <Clock className="h-4 w-4" />
                                                    <span>Last login {new Date(selectedUser.lastLogin).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <Globe className="h-4 w-4" />
                                                <span className="capitalize">
                                                    {selectedUser.preferredLanguages?.join(', ') || selectedUser.preferredLanguage || 'Not set'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Statistics Section */}
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Learning Statistics</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-primary-50 rounded-lg p-4 text-center">
                                                <Target className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                                                <div className="text-2xl font-bold text-primary-600">
                                                    {selectedUser.totalPracticeSessions || selectedUser.stats?.totalSessions || 0}
                                                </div>
                                                <div className="text-xs text-gray-600">Total Sessions</div>
                                            </div>

                                            <div className="bg-success-50 rounded-lg p-4 text-center">
                                                <TrendingUp className="h-6 w-6 text-success-600 mx-auto mb-2" />
                                                <div className="text-2xl font-bold text-success-600">
                                                    {selectedUser.averageScore?.toFixed(1) || selectedUser.stats?.avgScore?.toFixed(1) || '0'}%
                                                </div>
                                                <div className="text-xs text-gray-600">Avg Score</div>
                                            </div>

                                            <div className="bg-warning-50 rounded-lg p-4 text-center">
                                                <Award className="h-6 w-6 text-warning-600 mx-auto mb-2" />
                                                <div className="text-2xl font-bold text-warning-600">
                                                    {selectedUser.streakDays || selectedUser.stats?.currentStreak || 0}
                                                </div>
                                                <div className="text-xs text-gray-600">Current Streak</div>
                                            </div>

                                            <div className="bg-error-50 rounded-lg p-4 text-center">
                                                <Award className="h-6 w-6 text-error-600 mx-auto mb-2" />
                                                <div className="text-2xl font-bold text-error-600">
                                                    {selectedUser.longestStreak || selectedUser.stats?.maxStreak || 0}
                                                </div>
                                                <div className="text-xs text-gray-600">Longest Streak</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions Section */}
                                    <div className="border-t pt-4">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Actions</h4>
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => {
                                                    handleToggleActive(selectedUser._id, selectedUser.isActive)
                                                }}
                                                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                                                    selectedUser.isActive
                                                        ? 'bg-error-100 text-error-700 hover:bg-error-200'
                                                        : 'bg-success-100 text-success-700 hover:bg-success-200'
                                                }`}
                                            >
                                                {selectedUser.isActive ? (
                                                    <>
                                                        <UserX className="h-4 w-4 inline mr-2" />
                                                        Deactivate User
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserCheck className="h-4 w-4 inline mr-2" />
                                                        Activate User
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    )
} 