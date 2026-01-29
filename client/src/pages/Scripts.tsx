import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { scriptsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import {
    BookOpen,
    Search,
    Play,
    Clock,
    Plus,
    X,
    Upload,
    Save,
    Edit,
    Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

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

interface ScriptForm {
    title: string
    textContent: string
    language: 'english' | 'french' | 'swahili'
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    tags: string
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
    const [showForm, setShowForm] = useState(false)
    const [editingScript, setEditingScript] = useState<Script | null>(null)
    const [referenceAudioFile, setReferenceAudioFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue
    } = useForm<ScriptForm>()

    useEffect(() => {
        fetchScripts()
    }, [currentPage, selectedLanguage, selectedDifficulty])

    const fetchScripts = async () => {
        try {
            const params: any = {
                page: currentPage,
                limit: 12,
                fromDate: '2026-01-29' // Hide all old scripts, only show new uploads from today
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

    const onSubmit = async (data: ScriptForm) => {
        try {
            const formData = new FormData()
            formData.append('title', data.title)
            formData.append('textContent', data.textContent)
            formData.append('language', data.language)
            formData.append('difficulty', data.difficulty)
            
            const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : []
            formData.append('tags', JSON.stringify(tagsArray))

            if (referenceAudioFile) {
                formData.append('referenceAudio', referenceAudioFile)
            }

            if (editingScript) {
                await scriptsAPI.update(editingScript._id, formData)
                toast.success('Script updated successfully')
            } else {
                await scriptsAPI.create(formData)
                toast.success('Script created successfully')
            }

            reset()
            setReferenceAudioFile(null)
            setShowForm(false)
            setEditingScript(null)
            fetchScripts()
        } catch (error: any) {
            console.error('Error saving script:', error)
            toast.error(error.response?.data?.message || 'Failed to save script')
        }
    }

    const handleEdit = (script: Script) => {
        setEditingScript(script)
        setValue('title', script.title)
        setValue('textContent', script.textContent)
        setValue('language', script.language as any)
        setValue('difficulty', script.difficulty as any)
        setValue('tags', script.tags.join(', '))
        setShowForm(true)
    }

    const handleDelete = async (scriptId: string) => {
        if (!confirm('Are you sure you want to delete this script?')) return

        try {
            await scriptsAPI.delete(scriptId)
            toast.success('Script deleted successfully')
            fetchScripts()
        } catch (error) {
            console.error('Error deleting script:', error)
            toast.error('Failed to delete script')
        }
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (!file.type.startsWith('audio/')) {
                toast.error('Please select an audio file')
                return
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB')
                return
            }
            setReferenceAudioFile(file)
            toast.success('Audio file selected')
        }
    }

    const clearReferenceAudio = () => {
        setReferenceAudioFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleCancel = () => {
        setShowForm(false)
        setEditingScript(null)
        setReferenceAudioFile(null)
        reset()
    }

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Training Scripts</h1>
                    <p className="text-gray-600">
                        Browse, upload, and manage scripts to practice your language fluency
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="btn-primary flex items-center"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Script
                </button>
            </div>

            {/* Script Form */}
            {showForm && (
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {editingScript ? 'Edit Script' : 'Add New Script'}
                        </h2>
                        <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    {...register('title', { required: 'Title is required' })}
                                    className="input-field"
                                    placeholder="Enter script title"
                                />
                                {errors.title && (
                                    <p className="mt-1 text-sm text-error-600">{errors.title.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Language
                                </label>
                                <select
                                    {...register('language', { required: 'Language is required' })}
                                    className="input-field"
                                >
                                    <option value="">Select language</option>
                                    <option value="english">English</option>
                                    <option value="french">French</option>
                                    <option value="swahili">Swahili</option>
                                </select>
                                {errors.language && (
                                    <p className="mt-1 text-sm text-error-600">{errors.language.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Difficulty
                                </label>
                                <select
                                    {...register('difficulty', { required: 'Difficulty is required' })}
                                    className="input-field"
                                >
                                    <option value="">Select difficulty</option>
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                                {errors.difficulty && (
                                    <p className="mt-1 text-sm text-error-600">{errors.difficulty.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tags (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    {...register('tags')}
                                    className="input-field"
                                    placeholder="greetings, basic, daily"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Script Content
                            </label>
                            <textarea
                                {...register('textContent', {
                                    required: 'Script content is required',
                                    minLength: {
                                        value: 10,
                                        message: 'Script content must be at least 10 characters'
                                    }
                                })}
                                rows={6}
                                className="input-field"
                                placeholder="Enter the script text content..."
                            />
                            {errors.textContent && (
                                <p className="mt-1 text-sm text-error-600">{errors.textContent.message}</p>
                            )}
                        </div>

                        {/* Reference Audio Upload */}
                        <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Reference Audio (Optional)
                            </label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {referenceAudioFile ? 'Change Audio' : 'Upload Audio'}
                                </button>
                                {referenceAudioFile && (
                                    <>
                                        <span className="flex items-center text-sm text-gray-600">
                                            {referenceAudioFile.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={clearReferenceAudio}
                                            className="text-error-600 hover:text-error-700"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="audio/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary flex items-center"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {editingScript ? 'Update Script' : 'Create Script'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

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
                                    <button
                                        onClick={() => handleEdit(script)}
                                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                                        title="Edit script"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>

                                    <button
                                        onClick={() => handleDelete(script._id)}
                                        className="p-2 text-gray-400 hover:text-error-600 transition-colors"
                                        title="Delete script"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>

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