import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import type { AgentTrendSeries } from '../types';

type AgentTrendChartProps = {
  data?: AgentTrendSeries;
};

const COLORS = [
  '#2563EB',
  '#16A34A',
  '#F97316',
  '#A855F7',
  '#DC2626',
  '#0EA5E9',
  '#14B8A6',
  '#84CC16',
];

export function AgentTrendChart({ data }: AgentTrendChartProps) {
  if (!data || data.agents.length === 0 || data.points.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400">
        사원별 성과 추이 데이터가 없습니다.
      </div>
    );
  }

  const totalsByAgent: Record<string, number> = {};
  data.points.forEach((point) => {
    Object.entries(point.totalByAgent).forEach(([agentId, total]) => {
      totalsByAgent[agentId] = (totalsByAgent[agentId] ?? 0) + total;
    });
  });

  const rankedAgents = [...data.agents]
    .sort((a, b) => (totalsByAgent[b.id] ?? 0) - (totalsByAgent[a.id] ?? 0))
    .slice(0, 6);

  const rankedAgentIds = new Set(rankedAgents.map((agent) => agent.id));

  const chartData = data.points.map((point) => {
    const row: Record<string, number | string> = { date: point.date };
    rankedAgents.forEach((agent) => {
      const success = point.successByAgent[agent.id] ?? 0;
      const total = point.totalByAgent[agent.id] ?? 0;
      row[agent.id] = total > 0 ? Math.round((success / total) * 1000) / 10 : 0;
    });
    return row;
  });

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-gray-800">사원별 성과 추이</h3>
        <span className="text-xs text-gray-400">최근 7일 · 상위 6명 기준</span>
      </div>
      <div className="flex-1 min-h-[22rem] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip formatter={(value: number) => `${value}%`} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            {rankedAgents.map((agent, index) => (
              <Line
                key={agent.id}
                type="monotone"
                dataKey={agent.id}
                name={agent.name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
