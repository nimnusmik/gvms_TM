import { api } from "@/lib/axios";
import type { PaginatedResponse, PullRequestItem } from "../types";

type PullRequestListParams = {
  status?: "PENDING" | "APPROVED" | "REJECTED";
  agentId?: string;
  page?: number;
};

export const pullRequestApi = {
  list: async (params: PullRequestListParams = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append("status", params.status);
    if (params.agentId) queryParams.append("agent", params.agentId);
    if (params.page) queryParams.append("page", params.page.toString());

    const query = queryParams.toString();
    const url = query ? `/sales/pull-requests/?${query}` : "/sales/pull-requests/";
    const { data } = await api.get<PaginatedResponse<PullRequestItem>>(url);
    return data;
  },

  create: async (payload: { requested_count: number; request_note?: string }) => {
    const { data } = await api.post("/sales/pull-requests/", payload);
    return data;
  },

  approve: async (id: number) => {
    const { data } = await api.post(`/sales/pull-requests/${id}/approve/`);
    return data;
  },

  reject: async (id: number, reason?: string) => {
    const { data } = await api.post(`/sales/pull-requests/${id}/reject/`, { reason });
    return data;
  },
};
