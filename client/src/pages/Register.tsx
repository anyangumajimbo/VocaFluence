import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Mail, Lock, User, Globe, CheckCircle } from 'lucide-react'

interface RegisterForm {
    firstName: string;
    lastName: string;
    email: string
    password: string
    confirmPassword: string
    role: 'student' | 'admin'
    preferredLanguages: ('english' | 'french' | 'swahili')[]
}

export const Register: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['english'])
    const { register: registerUser } = useAuth()
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterForm>({
        defaultValues: {
            role: 'student',
            preferredLanguages: ['english']
        }
    })

    const password = watch('password')

    const toggleLanguage = (lang: string) => {
        setSelectedLanguages(prev => {
            if (prev.includes(lang)) {
                // Don't allow removing if it's the only language
                if (prev.length === 1) return prev
                return prev.filter(l => l !== lang)
            } else {
                // Don't allow more than 3 languages
                if (prev.length >= 3) return prev
                return [...prev, lang]
            }
        })
    }

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true)
        try {
            await registerUser(
                data.email,
                data.password,
                data.role,
                selectedLanguages,
                data.firstName,
                data.lastName
            )
            navigate('/dashboard')
        } catch (error) {
            console.error('Registration error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Join VocaFluence
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Create your account to start practicing
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        {/* First Name */}
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                First Name
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="firstName"
                                    {...register('firstName', { required: 'First name is required' })}
                                    type="text"
                                    className="input-field"
                                    placeholder="Enter your first name"
                                />
                            </div>
                            {errors.firstName && (
                                <p className="mt-1 text-sm text-error-600">{errors.firstName.message}</p>
                            )}
                        </div>
                        {/* Last Name */}
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                Last Name
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="lastName"
                                    {...register('lastName', { required: 'Last name is required' })}
                                    type="text"
                                    className="input-field"
                                    placeholder="Enter your last name"
                                />
                            </div>
                            {errors.lastName && (
                                <p className="mt-1 text-sm text-error-600">{errors.lastName.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Invalid email address'
                                        }
                                    })}
                                    type="email"
                                    className="input-field pl-10"
                                    placeholder="Enter your email"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 6,
                                            message: 'Password must be at least 6 characters'
                                        }
                                    })}
                                    type={showPassword ? 'text' : 'password'}
                                    className="input-field pl-10 pr-10"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    {...register('confirmPassword', {
                                        required: 'Please confirm your password',
                                        validate: value => value === password || 'Passwords do not match'
                                    })}
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className="input-field pl-10 pr-10"
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                Role
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    id="role"
                                    {...register('role')}
                                    className="input-field pl-10"
                                >
                                    <option value="student">Student</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                <Globe className="inline h-4 w-4 mr-1" />
                                Preferred Languages (Select 1-3)
                            </label>
                            <div className="space-y-3">
                                {(['english', 'french', 'swahili'] as const).map((lang) => {
                                    const isSelected = selectedLanguages.includes(lang);
                                    return (
                                        <div
                                            key={lang}
                                            onClick={() => toggleLanguage(lang)}
                                            className={`
                                                relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all
                                                ${isSelected 
                                                    ? 'border-primary-500 bg-primary-50 shadow-sm' 
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                                }
                                            `}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {}}
                                                className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                            />
                                            <span className={`ml-3 text-base font-medium ${isSelected ? 'text-primary-900' : 'text-gray-700'}`}>
                                                <span className="text-2xl mr-2">
                                                    {lang === 'english' && '🇺🇸'}
                                                    {lang === 'french' && '🇫🇷'}
                                                    {lang === 'swahili' && '🇹🇿'}
                                                </span>
                                                {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                            </span>
                                            {isSelected && (
                                                <span className="ml-auto">
                                                    <CheckCircle className="h-5 w-5 text-primary-600" />
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                <p className="text-xs text-gray-600">
                                    {selectedLanguages.length === 0 && '⚠️ Select at least one language'}
                                    {selectedLanguages.length > 0 && selectedLanguages.length < 3 && `✓ ${selectedLanguages.length} language${selectedLanguages.length > 1 ? 's' : ''} selected`}
                                    {selectedLanguages.length === 3 && '✓ Maximum 3 languages selected'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full flex justify-center py-3"
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="font-medium text-primary-600 hover:text-primary-500"
                            >
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
} 