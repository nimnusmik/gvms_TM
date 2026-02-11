export enum SalesStatus {
  NEW = 'NEW',           // 대기(미배정)
  ASSIGNED = 'ASSIGNED', // 배정됨
  TRYING = 'TRYING',     // 통화중
  REJECT = 'REJECT',     // 거절
  ABSENCE = 'ABSENCE',   // 부재
  INVALID = 'INVALID',   // 결번
  SUCCESS = 'SUCCESS',   // 성공
  BUY = 'BUY',           // 구매(2차)
  REFUSAL = 'REFUSAL',   // 거절(2차)
  HOLD = 'HOLD',         // 보류(2차)
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  age?: number;
  gender?: string;
  region?: string;
  category_1?: string;
  category_2?: string;
  category_3?: string;
  region_1?: string;
  region_2?: string;
  recycle_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SecondaryAssignment {
  id: number;
  status: SalesStatus | string;
  status_display?: string;
  agent_id?: string | null;
  agent_name?: string | null;
  agent_code?: string | null;
  assigned_at?: string;
  updated_at?: string;
}

export interface SalesAssignment {
  id: number;
  stage: string;
  stage_display?: string;

  status: SalesStatus | string;
  status_display?: string;
  sentiment?: string | null;
  item_interested?: string | null;
  memo?: string | null;
  customer: Customer;

  agent_id?: string | null;
  agent_name?: string | null;
  secondary_assignment?: SecondaryAssignment | null;

  agent_code?: string | null;
  call_count?: number;
  assigned_at: string;
  updated_at: string;
}

export interface CustomerParams {
  page?: number;
  status?: string;
  agentId?: string;
  secondaryStatus?: string;
  secondaryAgentId?: string;
  search?: string; 
}
