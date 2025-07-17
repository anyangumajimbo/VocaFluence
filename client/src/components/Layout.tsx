import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
    Home,
    BookOpen,
    Mic,
    History,
    User,
    Settings,
    LogOut,
    BarChart3,
    Users,
    FileText
} from 'lucide-react'

export const Layout: React.FC = () => {
    const { user, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Scripts', href: '/scripts', icon: BookOpen },
        { name: 'Practice', href: '/practice', icon: Mic },
        { name: 'History', href: '/history', icon: History },
        { name: 'Profile', href: '/profile', icon: User },
    ]

    const adminNavigation = [
        { name: 'Admin Dashboard', href: '/admin', icon: BarChart3 },
        { name: 'Manage Scripts', href: '/admin/scripts', icon: FileText },
        { name: 'Manage Users', href: '/admin/users', icon: Users },
    ]

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center justify-center border-b border-gray-200">
                        <h1 className="text-xl font-bold text-gradient">
                            VocaFluence
                        </h1>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 px-4 py-4">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href
                            return (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
                                            ? 'bg-primary-100 text-primary-700'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <item.icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </a>
                            )
                        })}

                        {/* Admin Navigation */}
                        {user?.role === 'admin' && (
                            <>
                                <div className="pt-4 pb-2">
                                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Admin
                                    </h3>
                                </div>
                                {adminNavigation.map((item) => {
                                    const isActive = location.pathname === item.href
                                    return (
                                        <a
                                            key={item.name}
                                            href={item.href}
                                            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
                                                    ? 'bg-primary-100 text-primary-700'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            <item.icon className="mr-3 h-5 w-5" />
                                            {item.name}
                                        </a>
                                    )
                                })}
                            </>
                        )}
                    </nav>

                    {/* User Info & Logout */}
                    <div className="border-t border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary-700">
                                        {user?.email.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-700">
                                        {user?.email}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">
                                        {user?.role}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="pl-64">
                <main className="py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
} 