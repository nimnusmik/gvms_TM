import { useState } from 'react';
import { aiServiceApi } from '../api/aiServiceApi';

export default function AiServicePage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setAnswer('');

    try {
      const result = await aiServiceApi.askQuestion(question);
      setAnswer(result.answer ?? '응답을 불러오지 못했습니다.');
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? '요청에 실패했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">AI 상담 도우미</h1>
          <p className="text-sm text-gray-500 mt-1">질문을 입력하면 AI가 빠르게 답변합니다.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">질문</label>
              <textarea
                className="w-full min-h-[120px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="예: 배터리 수명은 어떻게 되나요?"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? '답변 생성 중...' : 'AI에게 질문하기'}
            </button>
          </form>

          <div className="mt-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {answer && !error && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 whitespace-pre-line">
                {answer}
              </div>
            )}

            {!answer && !error && !loading && (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
                답변이 여기 표시됩니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
