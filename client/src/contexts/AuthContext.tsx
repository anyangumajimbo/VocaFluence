import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface User {
    id: string
    email: string
    role: 'student' | 'admin'
    preferredLanguage: 'english' | 'french' | 'swahili'
    schedule: {
        frequency: 'daily' | 'weekly' | 'custom'
        customDays?: string[]
        reminderTime?: string
    }
    createdAt: string
}

interface AuthContextType {
    user: User | null
    token: string | null
    login: (email: string, password: string) => Promise<void>
    register: (
        email: string,
        password: string,
        role?: string,
        preferredLanguage?: string,
        firstName?: string,
        lastName?: string
    ) => Promise<void>
    logout: () => void
    updateProfile: (data: Partial<User>) => Promise<void>
    loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const initializeAuth = async () => {
            if (token) {
                try {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
                    const response = await api.get('/auth/me')
                    setUser(response.data.user)
                } catch (error) {
                    console.error('Auth initialization error:', error)
                    localStorage.removeItem('token')
                    setToken(null)
                }
            }
            setLoading(false)
        }

        initializeAuth()
    }, [token])

    const login = async (email: string, password: string) => {
        try {
            const response = await api.post('/auth/login', { email, password })
            const { token: newToken, user: userData } = response.data

            localStorage.setItem('token', newToken)
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

            setToken(newToken)
            setUser(userData)

            toast.success('Login successful!')
        } catch (error: any) {
            const message = error.response?.data?.message || 'Login failed'
            toast.error(message)
            throw error
        }
    }

    const register = async (
        email: string,
        password: string,
        role = 'student',
        preferredLanguage = 'english',
        firstName = '',
        lastName = ''
    ) => {
        try {
            const response = await api.post('/auth/register', {
                email,
                password,
                role,
                preferredLanguage,
                firstName,
                lastName
            })
            const { token: newToken, user: userData } = response.data

            localStorage.setItem('token', newToken)
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

            setToken(newToken)
            setUser(userData)

            toast.success('Registration successful!')
        } catch (error: any) {
            const message = error.response?.data?.message || 'Registration failed'
            toast.error(message)
            throw error
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
        setToken(null)
        setUser(null)
        toast.success('Logged out successfully')
    }

    const updateProfile = async (data: Partial<User>) => {
        try {
            const response = await api.put('/auth/profile', data)
            setUser(response.data.user)
            toast.success('Profile updated successfully')
        } catch (error: any) {
            const message = error.response?.data?.message || 'Profile update failed'
            toast.error(message)
            throw error
        }
    }

    const value: AuthContextType = {
        user,
        token,
        login,
        register,
        logout,
        updateProfile,
        loading
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
} 