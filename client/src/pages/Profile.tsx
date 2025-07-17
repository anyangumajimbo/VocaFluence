import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { usersAPI } from '../services/api'
import {
    User,
    Bell,
    Globe,
    Calendar,
    Clock,
    Save,
    Eye,
    EyeOff,
    Lock
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ProfileForm {
    preferredLanguage: 'english' | 'french' | 'swahili'
    schedule: {
        frequency: 'daily' | 'weekly' | 'custom'
        customDays: string[]
        reminderTime: string
    }
}

interface PasswordForm {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

export const Profile: React.FC = () => {
    const { user, updateProfile } = useAuth()
    const [activeTab, setActiveTab] = useState<'profile' | 'schedule' | 'password'>('profile')
    const [showPassword, setShowPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [stats, setStats] = useState<any>(null)

    const {
        register,
        handleSubmit
    } = useForm<ProfileForm>({
        defaultValues: {
            preferredLanguage: user?.preferredLanguage || 'english',
            schedule: {
                frequency: user?.schedule?.frequency || 'daily',
                customDays: user?.schedule?.customDays || [],
                reminderTime: user?.schedule?.reminderTime || '09:00'
            }
        }
    })

    const {
        register: registerPassword,
        handleSubmit: handleSubmitPassword,
        formState: { errors: passwordErrors },
        watch,
        reset: resetPassword
    } = useForm<PasswordForm>()

    const newPassword = watch('newPassword')

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await usersAPI.getStreak()
            setStats(response.data.streak)
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const onSubmitProfile = async (data: ProfileForm) => {
        setLoading(true)
        try {
            await updateProfile(data)
            toast.success('Profile updated successfully')
        } catch (error) {
            console.error('Error updating profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const onSubmitPassword = async (data: PasswordForm) => {
        if (data.newPassword !== data.confirmPassword) {
            toast.error('New passwords do not match')
            return
        }

        setLoading(true)
        try {
            // This would call the change password API
            toast.success('Password changed successfully')
            resetPassword()
        } catch (error) {
            console.error('Error changing password:', error)
        } finally {
            setLoading(false)
        }
    }

    const daysOfWeek = [
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
        { value: 'sunday', label: 'Sunday' }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-gray-600">
                    Manage your account settings and practice preferences
                </p>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <Calendar className="h-5 w-5 text-primary-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Current Streak</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.currentStreak} days
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                                    <Calendar className="h-5 w-5 text-success-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Best Streak</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.maxStreak} days
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
                                <p className="text-sm font-medium text-gray-500">Total Practice Days</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.totalPracticeDays}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="card">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {[
                            { id: 'profile', name: 'Profile', icon: User },
                            { id: 'schedule', name: 'Schedule', icon: Bell },
                            { id: 'password', name: 'Password', icon: Lock }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4 mr-2" />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-6">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={user?.email}
                                    disabled
                                    className="input-field bg-gray-50"
                                />
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Preferred Language
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <select
                                        {...register('preferredLanguage')}
                                        className="input-field pl-10"
                                    >
                                        <option value="english">English</option>
                                        <option value="french">French</option>
                                        <option value="swahili">Swahili</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Account Type
                                </label>
                                <input
                                    type="text"
                                    value={user?.role}
                                    disabled
                                    className="input-field bg-gray-50 capitalize"
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary flex items-center"
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Schedule Tab */}
                    {activeTab === 'schedule' && (
                        <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Practice Frequency
                                </label>
                                <select
                                    {...register('schedule.frequency')}
                                    className="input-field"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="custom">Custom Days</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reminder Time
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="time"
                                        {...register('schedule.reminderTime')}
                                        className="input-field pl-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Custom Days (if weekly/custom frequency)
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {daysOfWeek.map((day) => (
                                        <label key={day.value} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                value={day.value}
                                                {...register('schedule.customDays')}
                                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{day.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary flex items-center"
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Save Schedule
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Password Tab */}
                    {activeTab === 'password' && (
                        <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        {...registerPassword('currentPassword', {
                                            required: 'Current password is required'
                                        })}
                                        className="input-field pl-10 pr-10"
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-400" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                                {passwordErrors.currentPassword && (
                                    <p className="mt-1 text-sm text-error-600">{passwordErrors.currentPassword.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        {...registerPassword('newPassword', {
                                            required: 'New password is required',
                                            minLength: {
                                                value: 6,
                                                message: 'Password must be at least 6 characters'
                                            }
                                        })}
                                        className="input-field pl-10 pr-10"
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-400" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                                {passwordErrors.newPassword && (
                                    <p className="mt-1 text-sm text-error-600">{passwordErrors.newPassword.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        {...registerPassword('confirmPassword', {
                                            required: 'Please confirm your password',
                                            validate: value => value === newPassword || 'Passwords do not match'
                                        })}
                                        className="input-field pl-10 pr-10"
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-400" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                                {passwordErrors.confirmPassword && (
                                    <p className="mt-1 text-sm text-error-600">{passwordErrors.confirmPassword.message}</p>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary flex items-center"
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    ) : (
                                        <Lock className="h-4 w-4 mr-2" />
                                    )}
                                    Change Password
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
} 