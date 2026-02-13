import type { MetricsRow } from "@/features/performance/types";

export interface Candidate {
  id: number;
  email: string;
  name: string;
}

export interface DashboardStats {
  total_customers: number;
  new_customers: number;
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

export interface PullRequestItem {
  id: number;
  agent: string;
  agent_id: string | null;
  agent_name: string | null;
  agent_code: string | null;
  requested_count: number;
  approved_count: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  status_display: string;
  request_note: string;
  reject_reason: string;
  processed_by: string | null;
  processed_by_id: string | null;
  processed_by_name: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}
