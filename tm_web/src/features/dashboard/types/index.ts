import type { MetricsRow } from "@/features/performance/types";

export interface Candidate {
  id: number;
  email: string;
  name: string;
}

export interface DashboardStats {
  total_customers: number;
  active_agents: number;
  total_agents: number;
  success_rate: number;
  today_total_calls: number;
  table?: MetricsRow[];
  chart?: {
    date: string;
    totalCalls: number;
    successCount: number;
    failCount: number;
  }[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AssignedCustomer {
  id: number;
  name: string;
  status: string;
  phone: string;
  created_at: string;
}
