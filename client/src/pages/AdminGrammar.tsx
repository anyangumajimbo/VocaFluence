import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface Lesson {
  _id: string;
  level: string;
  topicId: string;
  topicName: string;
  topicNameEn: string;
  day: number;
  title: string;
  explanation: string;
  exampleSentences: string[];
  isActive: boolean;
}

interface FormData {
  topicId: string;
  topicName: string;
  topicNameEn: string;
  day: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  explanation: string;
  exampleSentences: string[];
}

const initialFormState: FormData = {
  topicId: '',
  topicName: '',
  topicNameEn: '',
  day: 1,
  title: '',
  explanation: '',
  exampleSentences: [''],
};

export default function AdminGrammar() {
  const [selectedLevel, setSelectedLevel] = useState<'A1' | 'A2' | 'B1' | 'B2'>('A1');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Lesson | null>(null);

  const levels: ('A1' | 'A2' | 'B1' | 'B2')[] = ['A1', 'A2', 'B1', 'B2'];

  // Fetch lessons for selected level
  useEffect(() => {
    fetchLessonsByLevel();
  }, [selectedLevel]);

  const fetchLessonsByLevel = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/grammar/admin/lessons/${selectedLevel}`);
      if (response.data.success) {
        setLessons(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.topicId || !formData.topicName || !formData.title || !formData.explanation) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await api.post('/grammar/admin/lesson', {
        language: 'french',
        level: selectedLevel,
        ...formData,
      });

      if (response.data.success) {
        toast.success('Lesson created successfully');
        setFormData(initialFormState);
        setShowForm(false);
        fetchLessonsByLevel();
      }
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      toast.error(error.response?.data?.error || 'Failed to create lesson');
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson._id);
    setEditFormData({ ...lesson });
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editFormData || !editingLessonId) {
      toast.error('Invalid lesson data');
      return;
    }

    if (!editFormData.title || !editFormData.explanation) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await api.put(`/grammar/admin/lesson/${editingLessonId}`, {
        title: editFormData.title,
        explanation: editFormData.explanation,
        exampleSentences: editFormData.exampleSentences,
        isActive: editFormData.isActive,
      });

      if (response.data.success) {
        toast.success('Lesson updated successfully');
        setEditingLessonId(null);
        setEditFormData(null);
        fetchLessonsByLevel();
      }
    } catch (error: any) {
      console.error('Error updating lesson:', error);
      toast.error(error.response?.data?.error || 'Failed to update lesson');
    }
  };

  const handleCancelEdit = () => {
    setEditingLessonId(null);
    setEditFormData(null);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      const response = await api.delete(`/grammar/admin/lesson/${lessonId}`);
      if (response.data.success) {
        toast.success('Lesson deleted successfully');
        fetchLessonsByLevel();
      }
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };

  const handleAddExampleSentence = () => {
    setFormData({
      ...formData,
      exampleSentences: [...formData.exampleSentences, ''],
    });
  };

  const handleRemoveExampleSentence = (index: number) => {
    setFormData({
      ...formData,
      exampleSentences: formData.exampleSentences.filter((_, i) => i !== index),
    });
  };

  const handleExampleSentenceChange = (index: number, value: string) => {
    const newSentences = [...formData.exampleSentences];
    newSentences[index] = value;
    setFormData({
      ...formData,
      exampleSentences: newSentences,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Grammar Management</h1>

      {/* Level Tabs */}
      <div className="flex gap-4 mb-8 border-b">
        {levels.map(level => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              selectedLevel === level
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {level} Level
          </button>
        ))}
      </div>

      {/* Create New Lesson Button */}
      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {selectedLevel} Lessons ({lessons.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus size={20} />
          New Lesson
        </button>
      </div>

      {/* Create Lesson Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Create New Lesson</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Topic ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Topic ID (e.g., a1-01)
                </label>
                <input
                  type="text"
                  value={formData.topicId}
                  onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
                  placeholder="a1-01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Topic Name (French) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Topic Name (French)
                </label>
                <input
                  type="text"
                  value={formData.topicName}
                  onChange={(e) => setFormData({ ...formData, topicName: e.target.value })}
                  placeholder="Pronoms personnels"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Topic Name (English) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Topic Name (English)
                </label>
                <input
                  type="text"
                  value={formData.topicNameEn}
                  onChange={(e) => setFormData({ ...formData, topicNameEn: e.target.value })}
                  placeholder="Personal Pronouns"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Day */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Day (1-6)
                </label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6].map(d => (
                    <option key={d} value={d}>
                      Day {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lesson Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Understanding Personal Pronouns"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Explanation
              </label>
              <textarea
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                placeholder="Enter detailed explanation..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                required
              />
            </div>

            {/* Example Sentences */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Example Sentences
              </label>
              <div className="space-y-3">
                {formData.exampleSentences.map((sentence, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={sentence}
                      onChange={(e) => handleExampleSentenceChange(idx, e.target.value)}
                      placeholder={`Example sentence ${idx + 1}`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExampleSentence(idx)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddExampleSentence}
                className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                + Add Example Sentence
              </button>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Lesson
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData(initialFormState);
                }}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Lesson Modal */}
      {editingLessonId && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Edit Lesson</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateLesson} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Explanation
                </label>
                <textarea
                  value={editFormData.explanation}
                  onChange={(e) => setEditFormData({ ...editFormData, explanation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  required
                />
              </div>

              {/* Example Sentences */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Example Sentences
                </label>
                <div className="space-y-3">
                  {editFormData.exampleSentences.map((sentence, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={sentence}
                        onChange={(e) => {
                          const newSentences = [...editFormData.exampleSentences];
                          newSentences[idx] = e.target.value;
                          setEditFormData({ ...editFormData, exampleSentences: newSentences });
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSentences = editFormData.exampleSentences.filter((_, i) => i !== idx);
                          setEditFormData({ ...editFormData, exampleSentences: newSentences });
                        }}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditFormData({
                      ...editFormData,
                      exampleSentences: [...editFormData.exampleSentences, ''],
                    });
                  }}
                  className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  + Add Example Sentence
                </button>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 border-t pt-6">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lessons List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No lessons yet for {selectedLevel} level</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create First Lesson
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map(lesson => (
            <div
              key={lesson._id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{lesson.title}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-semibold whitespace-nowrap ml-2">
                    Day {lesson.day}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  <strong>Topic:</strong> {lesson.topicId} - {lesson.topicName}
                </p>

                <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                  {lesson.explanation}
                </p>

                <p className="text-sm text-gray-600 mb-4">
                  <strong>Examples:</strong> {lesson.exampleSentences.length} sentences
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteLesson(lesson._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                  <button 
                    onClick={() => handleEditLesson(lesson)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 size={18} />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
