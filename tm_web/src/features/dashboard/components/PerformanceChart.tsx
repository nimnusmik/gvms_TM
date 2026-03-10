import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine // 👈 1. 여기에 추가하세요!
} from 'recharts';

type ChartPoint = {
  date: string;
  totalCalls: number;
  successCount: number;
  failCount: number;
  absenceInvalidCount: number;
};

type PerformanceChartProps = {
  data: ChartPoint[];
};

export const PerformanceChart = ({ data }: PerformanceChartProps) => {
  const COLORS = {
    success: '#2563EB',
    fail: '#EF4444',
    absenceInvalid: '#F59E0B',
    successRate: '#16A34A',
    grid: '#EEF2F7',
    axis: '#94A3B8',
    text: '#0F172A',
  };

  const chartData = data.map((point) => ({
    ...point,
    successRate: point.totalCalls > 0 ? (point.successCount / point.totalCalls) * 100 : 0,
    stackedTotal: point.successCount + point.failCount + point.absenceInvalidCount,
  }));

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900">최근 7일 상담 성과 추이</h3>
          <p className="text-xs text-slate-500 mt-1">누적 막대(성공/실패/결번·부재) + 성공률</p>
        </div>
      </div>
      <div className="flex-1 min-h-[22rem] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} barCategoryGap={18} barGap={6} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barSuccess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.9} />
                <stop offset="100%" stopColor={COLORS.success} stopOpacity={0.35} />
              </linearGradient>
              <linearGradient id="barFail" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.fail} stopOpacity={0.9} />
                <stop offset="100%" stopColor={COLORS.fail} stopOpacity={0.35} />
              </linearGradient>
              <linearGradient id="barAbsenceInvalid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.absenceInvalid} stopOpacity={0.9} />
                <stop offset="100%" stopColor={COLORS.absenceInvalid} stopOpacity={0.35} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke={COLORS.grid} strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: COLORS.axis }}
              tickLine={false}
              axisLine={{ stroke: COLORS.grid }}
            />
            <YAxis
              yAxisId="left"
              domain={[0, 'dataMax']}
              tick={{ fontSize: 12, fill: COLORS.axis }}
              tickLine={false}
              axisLine={{ stroke: COLORS.grid }}
            />
            <YAxis
              yAxisId="rightRate"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: COLORS.axis }}
              tickFormatter={(value) => `${value}%`}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
                fontSize: 12,
                color: COLORS.text,
              }}
              formatter={(value: any, name: any) => {
                if (name === '성공률(%)') return [`${Number(value).toFixed(1)}%`, name];
                return [value, name];
              }}
              labelFormatter={(label, payload) => {
                const point = payload?.[0]?.payload;
                const total = point?.stackedTotal ?? 0;
                return `${label} · 총 ${total.toLocaleString()}건`;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
            
            {/* 👇 성공률 기준 30% 점선 */}
            <ReferenceLine 
              y={30} 
              yAxisId="rightRate" 
              stroke="#F87171" 
              strokeDasharray="3 3" 
              label={{ position: 'right', value: '기준 (성공률 30%)', fill: '#F87171', fontSize: 12 }} 
            />

            {/* 누적 막대 그래프: 성공/실패/결번·부재 */}
            <Bar
              yAxisId="left"
              dataKey="successCount"
              name="성공"
              barSize={22}
              fill="url(#barSuccess)"
              stroke={COLORS.success}
              strokeWidth={0.5}
              stackId="calls"
            />
            <Bar
              yAxisId="left"
              dataKey="failCount"
              name="실패"
              barSize={22}
              fill="url(#barFail)"
              stroke={COLORS.fail}
              strokeWidth={0.5}
              stackId="calls"
            />
            <Bar
              yAxisId="left"
              dataKey="absenceInvalidCount"
              name="결번/부재"
              barSize={22}
              fill="url(#barAbsenceInvalid)"
              stroke={COLORS.absenceInvalid}
              strokeWidth={0.5}
              stackId="calls"
            />

            {/* 성공률 라인 */}
            <Line
              yAxisId="rightRate"
              type="monotone"
              dataKey="successRate"
              name="성공률(%)"
              stroke={COLORS.successRate}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: COLORS.successRate, stroke: '#FFFFFF', strokeWidth: 1 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
