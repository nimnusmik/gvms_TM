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
}

export interface Candidate {
  id: number;
  email: string;
  name: string;
}

export interface DashboardStats {
  total_calls: number;
  active_agents: number;
  total_agents: number;
  success_rate: number;
}