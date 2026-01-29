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
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
