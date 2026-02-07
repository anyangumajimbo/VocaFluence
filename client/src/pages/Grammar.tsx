import { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Play, Lock, CheckCircle, ChevronRight, Home } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface GrammarLesson {
  _id: string;
  topicId: string;
  level: string;
  day: number;
  title: string;
  explanation: string;
  exampleSentences: string[];
  language: string;
}

interface LessonDay {
  day: number;
  title: string;
  _id: string;
  isCompleted: boolean;
  score?: number;
}

interface LessonTopic {
  topicId: string;
  topicName: string;
  topicNameEn: string;
  level: string;
  days: LessonDay[];
}

type ViewMode = 'selector' | 'lesson';

export default function Grammar() {
  
  // State for lesson selector
  const [availableLessons, setAvailableLessons] = useState<LessonTopic[]>([]);
  const [maxAccessibleDay, setMaxAccessibleDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('selector');
  
  // State for lesson view
  const [selectedLesson, setSelectedLesson] = useState<GrammarLesson | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<LessonTopic | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [submissionScore, setSubmissionScore] = useState<number | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<string[] | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'pass' | 'fail' | 'submitting'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetchAvailableLessons();
  }, []);

  const fetchAvailableLessons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/grammar/available');
      if (response.data.success) {
        setAvailableLessons(response.data.data.lessons);
        setMaxAccessibleDay(response.data.data.maxAccessibleDay);
      }
    } catch (error: any) {
      console.error('Error fetching available lessons:', error);
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const loadLesson = async (topicId: string, day: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/grammar/lesson/${topicId}/${day}`);
      if (response.data.success) {
        setSelectedLesson(response.data.data);
        setSelectedDay(day);
        
        // Find and set the topic
        const topic = availableLessons.find(t => t.topicId === topicId);
        if (topic) {
          setSelectedTopic(topic);
        }
        
        // Reset submission state for new lesson
        setSubmissionScore(null);
        setSubmissionFeedback(null);
        setSubmissionStatus('idle');
        setRecordedAudio(null);
        
        setViewMode('lesson');
      }
    } catch (error: any) {
      console.error('Error fetching lesson:', error);
      if (error.response?.status === 403) {
        toast.error(error.response.data.message || 'You cannot access this lesson yet');
      } else {
        toast.error('Failed to load lesson');
      }
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  };

  const submitLesson = async () => {
    if (!selectedDay || !selectedLesson || !recordedAudio) {
      toast.error('Please record your reading first');
      return;
    }

    try {
      setSubmissionStatus('submitting');
      setLoading(true);

      // Prepare FormData with audio file
      const formData = new FormData();
      formData.append('audio', recordedAudio, 'audio.webm');
      formData.append('topicId', selectedLesson.topicId);
      formData.append('day', selectedDay.toString());
      formData.append('duration', '10'); // Default duration

      const response = await api.post('/grammar/progress/save-reading', formData);

      if (response.data.success) {
        // Score >= 60, pass
        setSubmissionScore(response.data.score);
        setSubmissionFeedback(response.data.feedback);
        setSubmissionStatus('pass');
        toast.success(`Great! Score: ${response.data.score}/100. Moving to next lesson...`);
        
        // Refresh available lessons
        await fetchAvailableLessons();
        
        // Go back to selector after a short delay
        setTimeout(() => {
          setViewMode('selector');
          setSelectedLesson(null);
          setSelectedDay(null);
          setRecordedAudio(null);
          setSubmissionScore(null);
          setSubmissionFeedback(null);
          setSubmissionStatus('idle');
        }, 2000);
      }
    } catch (error: any) {
      const scoreData = error.response?.data;
      if (error.response?.status === 400 && scoreData?.score) {
        // Score < 60, fail
        setSubmissionScore(scoreData.score);
        setSubmissionFeedback(scoreData.feedback);
        setSubmissionStatus('fail');
        toast.error(`Score: ${scoreData.score}/100. Need 60+ to proceed. Try again!`);
      } else {
        console.error('Error submitting lesson:', error);
        toast.error(error.response?.data?.message || 'Failed to evaluate your reading');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && viewMode === 'selector') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Lesson Selector View
  if (viewMode === 'selector') {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Grammar Lessons</h1>
            <p className="text-gray-600 mt-2">
              Learn French grammar step by step. Complete each day to unlock the next one.
            </p>
          </div>
          <button
            onClick={() => fetchAvailableLessons()}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Progress Overview */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Current Progress</p>
              <p className="text-3xl font-bold">Day {maxAccessibleDay}</p>
              <p className="text-blue-100 mt-2">
                {maxAccessibleDay === 1 
                  ? 'Start your French grammar journey!' 
                  : `You can unlock up to day ${maxAccessibleDay}`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold opacity-20">{maxAccessibleDay}/10</div>
            </div>
          </div>
        </div>

        {/* Lessons by Topic */}
        <div className="space-y-4">
          {availableLessons.map((topic) => (
            <div key={topic.topicId} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{topic.topicName}</h2>
                    <p className="text-gray-600">({topic.topicNameEn})</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {topic.level}
                    </span>
                  </div>
                </div>

                {/* Days */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {topic.days.map((day) => {
                    const isLocked = day.day > maxAccessibleDay;
                    const isCompleted = day.isCompleted;
                    const isCurrent = day.day === maxAccessibleDay && !isCompleted;

                    return (
                      <button
                        key={day.day}
                        onClick={() => !isLocked && loadLesson(topic.topicId, day.day)}
                        disabled={isLocked}
                        className={`p-4 rounded-lg transition-all ${
                          isLocked
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isCurrent
                            ? 'bg-blue-600 text-white shadow-lg hover:shadow-xl'
                            : isCompleted
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold">Day {day.day}</span>
                          {isLocked && <Lock className="h-4 w-4" />}
                          {isCompleted && <CheckCircle className="h-4 w-4" />}
                          {isCurrent && <ChevronRight className="h-4 w-4" />}
                        </div>
                        <p className="text-xs mb-2 font-medium truncate">{day.title}</p>
                        {isCompleted && day.score && (
                          <div className="text-xs mt-2 font-semibold">Score: {day.score}%</div>
                        )}
                        {isCurrent && <div className="text-xs mt-2 text-blue-200">Available Now</div>}
                        {isLocked && <div className="text-xs mt-2">Locked</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {availableLessons.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800">No lessons available yet. Please check back later.</p>
          </div>
        )}
      </div>
    );
  }

  // Lesson View
  if (viewMode === 'lesson' && selectedLesson) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setViewMode('selector')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to Lessons
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedTopic?.topicName} - Day {selectedDay}
          </h1>
        </div>

        {/* Lesson Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedLesson.title}</h2>
          
          {/* Explanation */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Explanation</h3>
            <p className="text-gray-700 leading-relaxed">{selectedLesson.explanation}</p>
          </div>

          {/* Example Sentences */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Example Sentences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedLesson.exampleSentences.map((sentence, idx) => (
                <div key={idx} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-gray-800 italic">{sentence}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recording Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Practice Recording</h3>
            <p className="text-gray-600 mb-2">
              Read the lesson aloud and record yourself practicing. This helps improve your pronunciation.
            </p>
            <p className="text-orange-600 font-semibold mb-4">
              ⚠️ Minimum Score Required: 60+ to unlock the next lesson
            </p>

            <div className="flex gap-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Mic className="h-5 w-5" />
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <MicOff className="h-5 w-5" />
                  Stop Recording
                </button>
              )}

              {recordedAudio && (
                <button
                  onClick={() => {
                    const audioUrl = URL.createObjectURL(recordedAudio);
                    const audio = new Audio(audioUrl);
                    audio.play();
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Play className="h-5 w-5" />
                  Play Recording
                </button>
              )}
            </div>

            {isRecording && <p className="text-red-600 mt-3 font-semibold">🔴 Recording...</p>}
            {recordedAudio && <p className="text-green-600 mt-3 font-semibold">✓ Recording saved</p>}

            {/* Score Feedback */}
            {submissionScore !== null && (
              <div className={`mt-4 p-4 rounded-lg ${submissionStatus === 'pass' ? 'bg-green-100' : 'bg-red-100'}`}>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${submissionStatus === 'pass' ? 'text-green-700' : 'text-red-700'}`}>
                    Score: {submissionScore}/100
                  </p>
                  <p className={`text-lg font-semibold mt-2 ${submissionStatus === 'pass' ? 'text-green-700' : 'text-red-700'}`}>
                    {submissionStatus === 'pass' ? '✓ PASSED' : '✗ FAILED - Try Again'}
                  </p>
                  {submissionStatus === 'fail' && (
                    <p className="text-red-600 mt-2 font-semibold">You need 60+ to proceed</p>
                  )}
                  {submissionFeedback && submissionFeedback.length > 0 && (
                    <div className="mt-3 text-sm">
                      {submissionFeedback.map((comment, idx) => (
                        <p key={idx} className={submissionStatus === 'pass' ? 'text-green-700' : 'text-red-700'}>
                          • {comment}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="border-t pt-6 mt-6">
            {submissionStatus === 'fail' ? (
              <button
                onClick={() => {
                  // Clear recording and try again
                  setRecordedAudio(null);
                  setSubmissionScore(null);
                  setSubmissionFeedback(null);
                  setSubmissionStatus('idle');
                }}
                disabled={loading}
                className="w-full py-3 px-6 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Recording...' : 'Record Again'}
              </button>
            ) : (
              <button
                onClick={submitLesson}
                disabled={loading || !recordedAudio || submissionStatus === 'pass'}
                className="w-full py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? (submissionStatus === 'submitting' ? 'Evaluating...' : 'Processing...') : 'Complete Lesson & Continue'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
