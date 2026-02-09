export const TEAMS = [
    { value: 'SALES_TM', label: '1차 TM팀' },
    { value: 'SALES_MAIN', label: '2차 본영업팀' },
  ];
  
  export const AGENT_STATUS_OPTIONS = [
    { value: 'ONLINE', label: '🟢 온라인 (ONLINE)' },
    { value: 'OFFLINE', label: '⚫ 오프라인 (OFFLINE)' },
    { value: 'BUSY', label: '🔴 통화 중 (BUSY)' },
    { value: 'BREAK', label: '🟡 휴식 중 (BREAK)' },
    { value: 'RESIGNED', label: '🟠 퇴사 (RESIGNED)' }
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
    agent_id: string;
    name: string;

    email: string;
    code: string;

    assigned_phone: string;
    daily_cap: number;
    
    role: AgentRole;
    status: AgentStatus; 
    is_auto_assign?: boolean;
    
    created_at?: string;
    
    team: string | null;
    assigned_count: number;
  }
