
export interface MetricsRow {
    name: string;
    successRate: number;
    avgCallTime: string;
    contractCount: number;
    successCount: number;
    rejectCount: number;
    absenceCount: number;
    invalidCount: number;
  };
  
export interface ChartPoint {
    date: string;
    totalCalls: number;
    successCount: number;
    failCount: number;
    absenceInvalidCount: number;
  };

  export interface AgentTrendPoint {
    date: string;
    successByAgent: Record<string, number>;
    totalByAgent: Record<string, number>;
  }

  export interface AgentTrendSeries {
    agents: { id: string; name: string }[];
    points: AgentTrendPoint[];
  }
  
  export interface AgentCard {
    id: number | string;
    name: string;
    team?: string | null;
    status: string;
    avatar?: string | null;
    todayCalls: number;
    dailyGoal: number;
    successRate: number;
    totalCallTime: string;
  };
  
export interface  PerformanceData {
    cards: AgentCard[];
    table: MetricsRow[];
    chart: ChartPoint[];
    agentTrends?: AgentTrendSeries;
  };
  
