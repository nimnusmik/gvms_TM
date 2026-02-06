export const TEAMS = [
    { value: 'SALES_1', label: '영업 1팀' },
  ];
  
  export const AGENT_STATUS_OPTIONS = [
    { value: 'ONLINE', label: '🟢 온라인 (ONLINE)' },
    { value: 'OFFLINE', label: '⚫ 오프라인 (OFFLINE)' },
    { value: 'BUSY', label: '🔴 통화 중 (BUSY)' },
    { value: 'BREAK', label: '🟡 휴식 중 (BREAK)' },
    { value: 'RESIGNED', label: '🟠 퇴사 (RESIGN)' }
  ];

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
    RESIGNED = 'RESIGNED',
  }
  
  export interface Agent {
    agent_id: number;
    name: string;

    email: string;
    code: string;

    account_email: string;
    assigned_phone: string;
    daily_cap: number;
    
    role: AgentRole;
    status: AgentStatus; 
    
    created_at?: string;
    
    team: string | null;
    assigned_count: number;
  }
