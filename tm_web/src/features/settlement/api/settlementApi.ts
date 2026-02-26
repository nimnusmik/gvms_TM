import { api } from '@/lib/axios';
import type { PaginatedResponse, SettlementRow, SettlementSummaryResponse } from '../types';

export type SettlementFilters = {
  start_date: string;
  end_date: string;
  view: 'day' | 'week';
  agent_ids?: string[];
  page?: number;
};

const buildParams = (filters: SettlementFilters) => {
  const params: Record<string, string | number> = {
    start_date: filters.start_date,
    end_date: filters.end_date,
    view: filters.view,
  };
  if (filters.agent_ids && filters.agent_ids.length > 0) {
    params.agent_ids = filters.agent_ids.join(',');
  }
  if (filters.page) {
    params.page = filters.page;
  }
  return params;
};

export const settlementApi = {
  getSummary: async (filters: SettlementFilters) => {
    const { data } = await api.get<SettlementSummaryResponse>('/settlements/summary/', {
      params: buildParams(filters),
    });
    return data;
  },
  getRows: async (filters: SettlementFilters) => {
    const { data } = await api.get<PaginatedResponse<SettlementRow>>('/settlements/rows/', {
      params: buildParams(filters),
    });
    return data;
  },
  updateRow: async (id: number, payload: Partial<SettlementRow> & { final_amount?: number | null }) => {
    const { data } = await api.patch<SettlementRow>(`/settlements/${id}/`, payload);
    return data;
  },
  exportExcel: async (filters: SettlementFilters) => {
    return api.get('/settlements/export/', {
      params: buildParams(filters),
      responseType: 'blob',
    });
  },
};
