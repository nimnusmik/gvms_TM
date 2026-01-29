import { api } from '@/lib/axios';
import { PaginatedResponse,} from '../../dashboard/types';
import { Customer, CustomerParams } from '../types';

export const customerApi = {

    getCustomers: async (params: CustomerParams) => {
      const { page = 1, status, agentId, search } = params;
      
      // URL 파라미터 생성 (URLSearchParams 사용)
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      
      if (status && status !== 'ALL') queryParams.append('status', status);
      if (agentId && agentId !== 'ALL') queryParams.append('assigned_agent', agentId);
      if (search) queryParams.append('search', search); // 백엔드 검색 구현 시 사용
  
      const response = await api.get<PaginatedResponse<Customer>>(`/customers/?${queryParams.toString()}`);
      return response.data;
    },

  // 2. 엑셀 업로드 (핵심!)
  uploadExcel: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file); // 백엔드가 'file'이라는 키로 받기로 약속했음

    const response = await api.post('/customers/upload_excel/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // 파일 보낼 땐 필수 헤더
      },
    });
    return response.data;
  },

  assignAgent: async (customerId: number, agentId: string) => {
    // 부분 수정(Patch)으로 assigned_agent 필드만 업데이트
    const response = await api.patch(`/customers/${customerId}/`, {
      assigned_agent: agentId,
      status: 'ASSIGNED' // 배정되면 상태도 '배정됨'으로 자동 변경
    });
    return response.data;
    },
    
  bulkAssign: async (payload: { ids: number[]; agent_id: string }) => {
    // 백엔드가 url_path='bulk-assign' (하이픈)으로 되어있는지 꼭 확인!
    const { data } = await api.post('/customers/bulk-assign/', payload);
    return data;
  },
};