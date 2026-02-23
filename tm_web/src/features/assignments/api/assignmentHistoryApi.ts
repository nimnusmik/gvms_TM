import { api } from '@/lib/axios';
import type { AssignmentHistorySummaryResponse } from '../types';

export const assignmentHistoryApi = {
  getSummary: async (params: {
    start_date: string;
    end_date: string;
    agent_id?: string | null;
  }) => {
    const response = await api.get<AssignmentHistorySummaryResponse>('/sales/assignment-history/summary/', {
      params: {
        start_date: params.start_date,
        end_date: params.end_date,
        agent_id: params.agent_id || undefined,
      },
    });
    return response.data;
  },

  exportExcel: async (params: {
    start_date: string;
    end_date: string;
    agent_id?: string | null;
  }) => {
    const response = await api.get('/sales/assignment-history/export/', {
      params: {
        start_date: params.start_date,
        end_date: params.end_date,
        agent_id: params.agent_id || undefined,
      },
      responseType: 'blob',
    });
    return response;
  },
};
