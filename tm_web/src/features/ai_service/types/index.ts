export interface AiAnswerResponse {
  status: 'success' | 'error';
  question: string;
  answer: string;
}
