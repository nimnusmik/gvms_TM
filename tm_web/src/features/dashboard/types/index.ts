export enum AgentRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  AGENT = 'AGENT',
}

export enum AgentStatus {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  BREAK = 'BREAK',
  BUSY = 'BUSY',
}

export interface Agent {
  agent_id: string;
  name: string;
  account_email: string;
  assigned_phone: string;
  daily_cap: number;
  
  role: AgentRole;
  status: AgentStatus; 
  
  code?: string; 
  created_at?: string;
  
  team: string | null;
}

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
