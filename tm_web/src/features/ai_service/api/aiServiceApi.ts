import { api } from '@/lib/axios';
import { AiAnswerResponse } from '../types';

const getAiBaseURL = () => {
  const { hostname } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }

  return `http://${hostname}:8000`;
};

export const aiServiceApi = {
  askQuestion: async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) {
      throw new Error('질문 내용을 입력해주세요.');
    }

    const response = await api.get<AiAnswerResponse>(`${getAiBaseURL()}/ai/ask/`, {
      params: { question: trimmed },
    });

    return response.data;
  },
};
