import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://vocafluence.onrender.com/api'

export const api = axios.create({
    baseURL: API_URL,
    // Remove default Content-Type to let axios set it automatically for FormData
})

// Request interceptor to add auth token and handle content type
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // Set Content-Type for JSON requests, let axios handle FormData automatically
        if (!(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json'
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// API endpoints
export const authAPI = {
    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),
    register: (data: { email: string; password: string; role?: string; preferredLanguage?: string }) =>
        api.post('/auth/register', data),
    getProfile: () => api.get('/auth/me'),
    updateProfile: (data: any) => api.put('/auth/profile', data),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
        api.put('/auth/change-password', data),
}

export const scriptsAPI = {
    getAll: (params?: { language?: string; difficulty?: string; page?: number; limit?: number }) =>
        api.get('/scripts', { params }),
    getById: (id: string) => api.get(`/scripts/${id}`),
    getByLanguage: (language: string, params?: { difficulty?: string }) =>
        api.get(`/scripts/language/${language}`, { params }),
    create: (data: any) => api.post('/scripts', data),
    update: (id: string, data: any) => api.put(`/scripts/${id}`, data),
    delete: (id: string) => api.delete(`/scripts/${id}`),
}

export const practiceAPI = {
    submit: (data: FormData) => api.post('/practice/submit', data),
    getHistory: (params?: { page?: number; limit?: number }) =>
        api.get('/practice/history', { params }),
    getSession: (id: string) => api.get(`/practice/session/${id}`),
    getStats: () => api.get('/practice/stats'),
    getByScript: (scriptId: string, params?: { page?: number; limit?: number }) =>
        api.get(`/practice/script/${scriptId}`, { params }),
}

export const usersAPI = {
    getAll: (params?: { page?: number; limit?: number; role?: string; language?: string }) =>
        api.get('/users', { params }),
    getById: (id: string) => api.get(`/users/${id}`),
    getDashboard: () => api.get('/users/stats/overview'),
    getProgress: () => api.get('/users/stats/languages'),
    getStreak: () => api.get('/users/streak'),
    updateStatus: (id: string, data: { isActive: boolean }) =>
        api.put(`/users/${id}/status`, data),
}

export const remindersAPI = {
    getSettings: () => api.get('/reminders/settings'),
    updateSettings: (data: any) => api.put('/reminders/settings', data),
    getStatus: () => api.get('/reminders/status'),
    sendTest: (data: { userId: string; message?: string }) =>
        api.post('/reminders/test', data),
    getStats: () => api.get('/reminders/stats'),
    getStreak: () => api.get('/reminders/streak'),
}

export default api 