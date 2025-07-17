import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export const NotFound: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
                <p className="text-gray-600 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <div className="flex items-center justify-center space-x-4">
                    <Link
                        to="/dashboard"
                        className="btn-primary flex items-center"
                    >
                        <Home className="h-4 w-4 mr-2" />
                        Go to Dashboard
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="btn-secondary flex items-center"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    )
} 