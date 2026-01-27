import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, ArrowLeft } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface ForgotPasswordForm {
    email: string
}

export const ForgotPassword: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        getValues
    } = useForm<ForgotPasswordForm>()

    const onSubmit = async (data: ForgotPasswordForm) => {
        setIsLoading(true)
        try {
            await api.post('/auth/forgot-password', { email: data.email })
            setEmailSent(true)
            toast.success('Password reset instructions sent!')
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to process request'
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <Link
                        to="/login"
                        className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to login
                    </Link>
                    <h2 className="text-center text-3xl font-extrabold text-gray-900">
                        Reset your password
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {emailSent
                            ? 'Check your instructions below'
                            : 'Enter your email address and we\'ll send you instructions to reset your password'}
                    </p>
                </div>

                {!emailSent ? (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                                    className="input-field pl-10"
                                    placeholder="Enter your email"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full flex justify-center py-3 px-4"
                            >
                                {isLoading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    'Send reset instructions'
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="mt-8 space-y-6">
                        <div className="rounded-lg bg-success-50 p-4 border border-success-200">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <Mail className="h-5 w-5 text-success-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-success-800">
                                        Instructions sent!
                                    </h3>
                                    <div className="mt-2 text-sm text-success-700">
                                        <p>
                                            We've sent password reset instructions to <strong>{getValues('email')}</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Token display removed for security */}

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Didn't receive the email?{' '}
                                <button
                                    onClick={() => setEmailSent(false)}
                                    className="font-medium text-primary-600 hover:text-primary-500"
                                >
                                    Try again
                                </button>
                            </p>
                        </div>
                    </div>
                )}

                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Remember your password?{' '}
                        <Link
                            to="/login"
                            className="font-medium text-primary-600 hover:text-primary-500"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
