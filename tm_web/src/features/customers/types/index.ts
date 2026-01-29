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
    assigned_agent?: number; // 이건 숫자 (ID)
    agent_name?: string;     // ✨ [추가] 이건 문자 (이름)
    created_at: string;
    memo?: string;
  }


export interface CustomerParams {
    page?: number;
    status?: string;
    agentId?: string; // "null" 또는 숫자 ID
    search?: string;  // 검색어도 서버 필터링 가능하면 좋음 (현재는 프론트 필터인듯 하지만 일단 준비)
  }