export type SettlementSummaryCards = {
  total_amount: number;
  avg_unit_price: number;
  billable_count: number;
  pending_amount: number;
};

export type SettlementChartPoint = {
  label: string;
  success_count: number;
  reject_count: number;
  invalid_count: number;
  absence_count?: number;
  amount: number;
};

export type SettlementRow = {
  id: number;
  agent_id: string;
  agent_name: string;
  team: string | null;
  success_count: number;
  reject_count: number;
  invalid_count: number;
  absence_count: number;
  billable_count: number;
  calculated_amount: number;
  final_amount: number | null;
  status: 'PENDING' | 'REVIEW' | 'PAID';
  status_label: string;
  note: string;
};

export type SettlementSummaryResponse = {
  cards: SettlementSummaryCards;
  chart: SettlementChartPoint[];
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
