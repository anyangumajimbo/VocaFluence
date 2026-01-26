import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import {
    Home,
    BookOpen,
    Mic,
    History,
    User,
    LogOut,
    BarChart3,
    Users,
    FileText,
    Menu,
    X,
    MessageSquare
} from 'lucide-react'

export const Layout: React.FC = () => {
    const { user, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Scripts', href: '/scripts', icon: BookOpen },
        { name: 'Practice', href: '/practice', icon: Mic },
        { name: 'Oral Exam', href: '/oral-exam', icon: Mic },
        { name: 'History', href: '/history', icon: History },
        { name: 'Feedback', href: '/feedback', icon: MessageSquare },
        { name: 'Profile', href: '/profile', icon: User },
    ]

    const adminNavigation = [
        { name: 'Admin Dashboard', href: '/admin', icon: BarChart3 },
        { name: 'Manage Scripts', href: '/admin/scripts', icon: FileText },
        { name: 'Manage Users', href: '/admin/users', icon: Users },
        { name: 'Review Center', href: '/admin/review', icon: MessageSquare },
    ]

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50 mobile-safe-area">
            {/* Mobile menu overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden mobile-tap-highlight"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 mobile-safe-area">
                        <h1 className="text-xl font-bold text-gradient mobile-heading">
                            VocaFluence
                        </h1>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 mobile-touch-target"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto mobile-space-y">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors mobile-nav-item mobile-touch-target ${isActive
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                    <span className="truncate mobile-body">{item.name}</span>
                                </Link>
                            )
                        })}

                        {/* Admin Navigation */}
                        {user?.role === 'admin' && (
                            <>
                                <div className="pt-4 pb-2">
                                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mobile-caption">
                                        Admin
                                    </h3>
                                </div>
                                {adminNavigation.map((item) => {
                                    const isActive = location.pathname === item.href
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors mobile-nav-item mobile-touch-target ${isActive
                                                ? 'bg-primary-100 text-primary-700'
                                                : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                            <span className="truncate mobile-body">{item.name}</span>
                                        </Link>
                                    )
                                })}
                            </>
                        )}
                    </nav>

                    {/* User Info & Logout */}
                    <div className="border-t border-gray-200 p-4 mobile-safe-area">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center min-w-0">
                                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-medium text-primary-700 mobile-caption">
                                        {user?.email.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="ml-3 min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-700 truncate mobile-body">
                                        {user?.email}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize mobile-caption">
                                        {user?.role}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mobile-touch-target"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="lg:pl-64">
                {/* Mobile header */}
                <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 mobile-safe-area">
                    <div className="flex items-center justify-between px-4 py-3 mobile-padding">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 text-gray-500 hover:text-gray-700 mobile-touch-target"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <h1 className="text-lg font-bold text-gradient mobile-heading">
                            VocaFluence
                        </h1>
                        <div className="flex items-center space-x-2 mobile-space-x">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-700 mobile-caption">
                                    {user?.email.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors mobile-touch-target"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <main className="py-4 lg:py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mobile-padding">
                        <div className="mobile-fade-in">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
} 