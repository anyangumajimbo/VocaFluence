import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Practice } from './pages/Practice'
import { Scripts } from './pages/Scripts'
import { History } from './pages/History'
import { Profile } from './pages/Profile'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminScripts } from './pages/AdminScripts'
import { AdminUsers } from './pages/AdminUsers'
import { NotFound } from './pages/NotFound'

function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="practice" element={<Practice />} />
                    <Route path="scripts" element={<Scripts />} />
                    <Route path="history" element={<History />} />
                    <Route path="profile" element={<Profile />} />

                    {/* Admin routes */}
                    <Route path="admin" element={<AdminDashboard />} />
                    <Route path="admin/scripts" element={<AdminScripts />} />
                    <Route path="admin/users" element={<AdminUsers />} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </AuthProvider>
    )
}

export default App 