import { api } from '@/lib/axios'; 
import type { DashboardStats } from '../types';

export const dashboardApi = {
  // 통계 데이터 가져오기
  getStats: async (): Promise<DashboardStats> => {
    // 백엔드 URL에 맞게 수정 (agents/dashboard_stats/)
    const { data } = await api.get('/agents/dashboard_stats/');
    return data;
  },
};