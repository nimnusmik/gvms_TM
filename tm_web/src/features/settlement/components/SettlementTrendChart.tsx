import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import type { SettlementChartPoint } from '../types';

const formatNumber = (value: number) => new Intl.NumberFormat('ko-KR').format(value);

type SettlementTrendChartProps = {
  data: SettlementChartPoint[];
  viewLabel: string;
};

export function SettlementTrendChart({ data, viewLabel }: SettlementTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400">
        정산 추이 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-gray-800">정산 추이</h3>
        <span className="text-xs text-gray-400">{viewLabel}</span>
      </div>
      <div className="flex-1 min-h-[22rem] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="count" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="amount"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${formatNumber(Number(value))}`}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'amount') {
                  return [`${formatNumber(value)}원`, '정산액'];
                }
                return [value, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar yAxisId="count" dataKey="success_count" name="SUCCESS" stackId="a" fill="#10B981" />
            <Bar yAxisId="count" dataKey="reject_count" name="REJECT" stackId="a" fill="#F59E0B" />
            <Bar yAxisId="count" dataKey="invalid_count" name="INVALID" stackId="a" fill="#94A3B8" />
            <Bar yAxisId="count" dataKey="absence_count" name="ABSENCE" stackId="a" fill="#F97316" />
            <Line
              yAxisId="amount"
              dataKey="amount"
              name="amount"
              stroke="#2563EB"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
