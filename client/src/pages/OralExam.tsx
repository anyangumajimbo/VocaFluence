import React, { useState } from 'react';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface Evaluation {
    commentaireGlobal?: string;
}

const OralExam: React.FC = () => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [question, setQuestion] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Helper: get auth token from localStorage (adjust if you use context)
    const getToken = () => localStorage.getItem('token');

    const startSession = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/oral-exam/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                }
            });
            if (!res.ok) throw new Error('Failed to start session');
            const data = await res.json();
            setSessionId(data.sessionId);
            setQuestion(data.question);
            setMessages([
                { role: 'system', content: 'Examen DELF B2 - Session commencée.' },
                { role: 'assistant', content: data.aiMessage }
            ]);
            setEvaluation(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || !sessionId) return;
        setLoading(true);
        setError(null);
        try {
            const userMsg: Message = { role: 'user', content: input };
            setMessages(prev => [...prev, userMsg]);
            setInput('');
            const res = await fetch(`/api/oral-exam/session/${sessionId}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ userMessage: input })
            });
            if (!res.ok) throw new Error('Failed to send message');
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.aiMessage }]);
            // Simple check for evaluation (could be improved)
            if (/Cohérence|Richesse du vocabulaire|Correction grammaticale|Prononciation|points forts|axes d'amélioration|commentaire global/i.test(data.aiMessage)) {
                setEvaluation({ commentaireGlobal: data.aiMessage });
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">DELF B2 Oral Exam Simulator</h1>
            {!sessionId ? (
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                    onClick={startSession}
                    disabled={loading}
                >
                    {loading ? 'Starting...' : 'Start New Exam'}
                </button>
            ) : (
                <>
                    <div className="mb-4">
                        <div className="font-semibold">Sujet :</div>
                        <div className="italic">{question}</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded mb-4 h-64 overflow-y-auto">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                                <span className={msg.role === 'user' ? 'font-semibold text-blue-700' : 'font-semibold text-green-700'}>
                                    {msg.role === 'user' ? 'Vous' : 'Examinateur'}:
                                </span> {msg.content}
                            </div>
                        ))}
                    </div>
                    {!evaluation && (
                        <div className="flex gap-2">
                            <input
                                className="flex-1 border px-2 py-1 rounded"
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                disabled={loading}
                                placeholder="Votre réponse..."
                            />
                            <button
                                className="bg-blue-600 text-white px-4 py-1 rounded"
                                onClick={sendMessage}
                                disabled={loading}
                            >
                                Envoyer
                            </button>
                        </div>
                    )}
                    {evaluation && (
                        <div className="mt-4 p-3 bg-green-100 rounded">
                            <div className="font-bold mb-2">Évaluation finale :</div>
                            <div>{evaluation.commentaireGlobal}</div>
                        </div>
                    )}
                </>
            )}
            {error && <div className="text-red-600 mt-4">{error}</div>}
        </div>
    );
};

export default OralExam; 