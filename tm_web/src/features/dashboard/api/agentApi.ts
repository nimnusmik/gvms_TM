import { api } from '@/lib/axios';
import type { Agent, Candidate} from '../types';


export const agentApi = {
  // 1. 상담원 목록 조회
  getAgents: async () => {
    const response = await api.get<Agent[]>('/agents/');
    return response.data;
  },

  // 2. 상담원 등록 (후보자 -> 상담원 승격)
  createAgent: async (data: any) => {
    const response = await api.post('/agents/', data);
    return response.data;
  },

  // 3. 아직 상담원이 아닌 유저 목록 조회 (드롭다운용)
  getCandidates: async () => {
    const response = await api.get<Candidate[]>('/agents/candidates/');
    return response.data;
  }
};