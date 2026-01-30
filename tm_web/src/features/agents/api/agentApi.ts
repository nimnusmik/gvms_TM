import { api } from '@/lib/axios';
import type { Candidate} from '../../dashboard/types';
import type { Agent} from '../../agents/types';


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
  }, 

  updateAgent: async (id: string, data: Partial<Agent>) => {
    const response = await api.patch(`/agents/${id}/`, data);
    return response.data;
  },

  // ✨ 2. 등록 해제/삭제 (DELETE)
  deleteAgent: async (id: string) => {
    await api.delete(`/agents/${id}/`);
  },
};

