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

  updateAgent: async (id: number, data: Partial<Agent>) => {
    const response = await api.patch(`/agents/${id}/`, data);
    return response.data;
  },

  // 5. 퇴사 처리 (fetch -> axios 변경)
  resignAgent: async (id: number) => {
    // axios는 토큰을 알아서 넣어줍니다 (lib/axios 설정 덕분)
    // 400, 500 에러가 나면 알아서 throw 하므로 'if (!ok)' 체크 불필요
    const response = await api.post(`/agents/${id}/resign/`);
    return response.data;
  },

  // 6. 완전 삭제 (fetch -> axios 변경)
  deleteAgent: async (id: number) => {
    // 백엔드에서 에러 메시지를 보내면, UI의 catch(error) 블록에서 
    // error.response.data 로 꺼낼 수 있습니다.
    const response = await api.delete(`/agents/${id}/`);
    return response.data;
  }
};

