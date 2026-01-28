import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { scriptsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import {
    BookOpen,
    Search,
    Play,
    Clock
} from 'lucide-react'

interface Script {
    _id: string
    title: string
    textContent: string
    language: string
    difficulty: string
    referenceAudioURL?: string
    tags: string[]
    createdAt: string
    uploadedBy: {
        email: string
    }
}

export const Scripts: React.FC = () => {
    const { user } = useAuth()
    const [scripts, setScripts] = useState<Script[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedLanguage, setSelectedLanguage] = useState<string>(user?.preferredLanguages?.[0] || '')
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        fetchScripts()
    }, [currentPage, selectedLanguage, selectedDifficulty])

    const fetchScripts = async () => {
        try {
            const params: any = {
                page: currentPage,
                limit: 12
            }

            // Get user's preferred languages or show all languages
            const userLanguages = selectedLanguage 
                ? [selectedLanguage] 
                : ['english', 'french', 'swahili'] // Show all languages when no specific language is selected
            
            // Send as comma-separated string
            params.languages = userLanguages.join(',')

            if (selectedDifficulty) params.difficulty = selectedDifficulty

            const response = await scriptsAPI.getAll(params)
            
            // Additional client-side filtering to ensure only selected languages
            const filteredByLanguage = response.data.scripts.filter(
                (script: Script) => userLanguages.some(lang =>
                    script.language.toLowerCase() === lang.toLowerCase()
                )
            )
            
            // Sort scripts by difficulty level: beginner → intermediate → advanced
            const difficultyOrder: { [key: string]: number } = {
                'beginner': 1,
                'intermediate': 2,
                'advanced': 3
            }
            
            const sortedScripts = filteredByLanguage.sort((a: Script, b: Script) => {
                const diffA = difficultyOrder[a.difficulty.toLowerCase()] || 999
                const diffB = difficultyOrder[b.difficulty.toLowerCase()] || 999
                return diffA - diffB
            })
            
            setScripts(sortedScripts)
            setTotalPages(response.data.pagination.pages)
        } catch (error) {
            console.error('Error fetching scripts:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredScripts = scripts.filter(script =>
        script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        script.textContent.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner':
                return 'bg-success-100 text-success-800'
            case 'intermediate':
                return 'bg-warning-100 text-warning-800'
            case 'advanced':
                return 'bg-error-100 text-error-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getLanguageFlag = (language: string) => {
        switch (language) {
            case 'english':
                return '🇺🇸'
            case 'french':
                return '🇫🇷'
            case 'swahili':
                return '🇹🇿'
            default:
                return '🌍'
        }
    }

    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text
        return text.substring(0, maxLength) + '...'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Training Scripts</h1>
                <p className="text-gray-600">
                    Browse and select scripts to practice your language fluency
                </p>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search scripts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-field pl-10"
                            />
                        </div>
                    </div>

                    {/* Language Filter */}
                    <div className="flex-shrink-0">
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="input-field"
                        >
                            <option value="">All Languages</option>
                            <option value="english">English</option>
                            <option value="french">French</option>
                            <option value="swahili">Swahili</option>
                        </select>
                    </div>

                    {/* Difficulty Filter */}
                    <div className="flex-shrink-0">
                        <select
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                            className="input-field"
                        >
                            <option value="">All Difficulties</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Scripts Grid */}
            {filteredScripts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredScripts.map((script) => (
                        <div key={script._id} className="card-hover group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <span className="text-lg">{getLanguageFlag(script.language)}</span>
                                    <span className="text-sm font-medium text-gray-900 capitalize">
                                        {script.language}
                                    </span>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(script.difficulty)}`}>
                                    {script.difficulty}
                                </span>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                                {script.title}
                            </h3>

                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                {truncateText(script.textContent, 120)}
                            </p>

                            {/* Tags */}
                            {script.tags && script.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {script.tags.slice(0, 3).map((tag, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                    {script.tags.length > 3 && (
                                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                            +{script.tags.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                        {new Date(script.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex items-center space-x-2">
                                    {script.referenceAudioURL && (
                                        <button
                                            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                                            title="Play reference audio"
                                        >
                                            <Play className="h-4 w-4" />
                                        </button>
                                    )}

                                    <Link
                                        to={`/practice?script=${script._id}`}
                                        className="btn-primary text-sm"
                                    >
                                        Practice
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No scripts found</h3>
                    <p className="text-gray-500">
                        {searchTerm || selectedLanguage || selectedDifficulty
                            ? 'Try adjusting your filters'
                            : 'No scripts are available yet'
                        }
                    </p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card text-center">
                    <div className="text-2xl font-bold text-primary-600">
                        {scripts.length}
                    </div>
                    <p className="text-sm text-gray-500">Total Scripts</p>
                </div>

                <div className="card text-center">
                    <div className="text-2xl font-bold text-success-600">
                        {scripts.filter(s => s.referenceAudioURL).length}
                    </div>
                    <p className="text-sm text-gray-500">With Audio</p>
                </div>

                <div className="card text-center">
                    <div className="text-2xl font-bold text-warning-600">
                        {scripts.filter(s => user?.preferredLanguages?.includes(s.language as any)).length}
                    </div>
                    <p className="text-sm text-gray-500">Your Languages</p>
                </div>
            </div>
        </div>
    )
} 