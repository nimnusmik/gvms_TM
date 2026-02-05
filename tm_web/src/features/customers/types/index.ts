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
    status: CustomerStatus;
    assigned_agent?: number; 
    memo?: string;

      // 👇 [신규] 백엔드 모델에 추가한 필드들
    category_1?: string; // 분야1 (업종 등)
    category_2?: string; // 분야2 (주생산품 등)
    category_3?: string; // 분야3
    region?: string;     // 지역 통합 (지역1 + 지역2)
    
    // 👇 [신규] Serializer에서 계산해서 주는 필드
    agent_name: string;  // 담당자 이름 (없으면 '-')
    call_count: number;  // 전화 횟수
    
    created_at: string;
  }

export interface CustomerParams {
    page?: number;
    status?: string;
    agentId?: string;
    team?: string;
    search?: string; 
  }
