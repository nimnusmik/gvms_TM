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
    assigned_agent?: number; 
    agent_name?: string;     
    created_at: string;
    memo?: string;

    team: string | null;          
    team_display: string | null;  
  }

export interface CustomerParams {
    page?: number;
    status?: string;
    agentId?: string;
    team?: string;
    search?: string; 
  }
