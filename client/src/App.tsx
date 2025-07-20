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

                {/* Root path - redirect to dashboard if authenticated, login if not */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Protected routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Dashboard />} />
                </Route>

                <Route path="/practice" element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Practice />} />
                </Route>

                <Route path="/scripts" element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Scripts />} />
                </Route>

                <Route path="/history" element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }>
                    <Route index element={<History />} />
                </Route>

                <Route path="/profile" element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Profile />} />
                </Route>

                {/* Admin routes */}
                <Route path="/admin" element={
                    <ProtectedRoute requireAdmin>
                        <Layout />
                    </ProtectedRoute>
                }>
                    <Route index element={<AdminDashboard />} />
                </Route>

                <Route path="/admin/scripts" element={
                    <ProtectedRoute requireAdmin>
                        <Layout />
                    </ProtectedRoute>
                }>
                    <Route index element={<AdminScripts />} />
                </Route>

                <Route path="/admin/users" element={
                    <ProtectedRoute requireAdmin>
                        <Layout />
                    </ProtectedRoute>
                }>
                    <Route index element={<AdminUsers />} />
                </Route>

                {/* Catch all - redirect to login if not authenticated */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </AuthProvider>
    )
}

export default App 