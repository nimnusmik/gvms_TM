import { api } from '@/lib/axios';
import { Customer } from '../types';

export const customerApi = {
  // 1. 고객 목록 조회
  getCustomers: async () => {
    const response = await api.get<Customer[]>('/customers/');
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
  
};