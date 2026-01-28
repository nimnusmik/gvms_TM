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

export enum CustomerStatus {
  NEW = 'NEW',           // 접수(신규)
  ASSIGNED = 'ASSIGNED', // 배정됨
  TRYING = 'TRYING',     // 통화중
  REJECT = 'REJECT',     // 거절
  SUCCESS = 'SUCCESS',   // 성공
  LATER = 'LATER',       // 재통화
  INVALID = 'INVALID',   // 결번
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  age?: number;
  gender?: string;
  region?: string;
  status: CustomerStatus;
  assigned_agent?: number; // 상담원 ID
  created_at: string;
  memo?: string;
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

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CustomerParams {
  page?: number;
  status?: string;
  agentId?: string; // "null" 또는 숫자 ID
  search?: string;  // 검색어도 서버 필터링 가능하면 좋음 (현재는 프론트 필터인듯 하지만 일단 준비)
}