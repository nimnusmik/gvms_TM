export interface AssignmentHistorySummaryItem {
  date: string;
  agent_id: string;
  agent_name: string;
  assigned_count: number;
}

export interface AssignmentHistorySummaryResponse {
  items: AssignmentHistorySummaryItem[];
}
