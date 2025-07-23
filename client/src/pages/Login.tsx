import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

interface LoginForm {
    email: string
    password: string
}

export const Login: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || '/dashboard'

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>()

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true)
        try {
            await login(data.email, data.password)
            navigate(from, { replace: true })
        } catch (error) {
            console.error('Login error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4 sm:p-6 lg:p-8 mobile-safe-area">
            <div className="max-w-md w-full space-y-6 sm:space-y-8 mobile-padding mobile-fade-in">
                <div className="mobile-space-y">
                    <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-gray-900 mobile-heading">
                        Welcome to VocaFluence
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 mobile-body">
                        Sign in to your account to continue practicing
                    </p>
                </div>

                <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6 mobile-space-y" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4 mobile-space-y">
                        <div className="mobile-form-group">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mobile-form-label">
                                Email address
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
                                    autoComplete="email"
                                    className="input-field pl-10 text-base mobile-touch-target"
                                    placeholder="Enter your email"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-error-600 mobile-caption">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="mobile-form-group">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mobile-form-label">
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
                                    autoComplete="current-password"
                                    className="input-field pl-10 pr-10 text-base mobile-touch-target"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center mobile-touch-target"
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
                                <p className="mt-1 text-sm text-error-600 mobile-caption">{errors.password.message}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full flex justify-center py-3 px-4 text-sm sm:text-base mobile-touch-target mobile-btn-lg"
                        >
                            {isLoading ? (
                                <div className="mobile-loading-spinner"></div>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </div>

                    <div className="text-center space-y-2 mobile-space-y">
                        <p className="text-sm text-gray-600 mobile-body">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="font-medium text-primary-600 hover:text-primary-500 mobile-touch-target"
                            >
                                Sign up here
                            </Link>
                        </p>
                        <p className="text-sm text-gray-600 mobile-body">
                            <Link
                                to="/forgot-password"
                                className="font-medium text-primary-600 hover:text-primary-500 mobile-touch-target"
                            >
                                Forgot your password?
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
} 