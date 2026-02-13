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
};

type PerformanceChartProps = {
  data: ChartPoint[];
};

export const PerformanceChart = ({ data }: PerformanceChartProps) => {
  const chartData = data.map((point) => ({
    ...point,
    successRate: point.totalCalls > 0 ? (point.successCount / point.totalCalls) * 100 : 0,
  }));

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
      <h3 className="font-bold text-gray-800 mb-4">시간별/아이템별 성과 추이</h3>
      <div className="flex-1 min-h-[22rem] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{fontSize: 12}} />
            <YAxis yAxisId="left" domain={[0, 200]} tick={{fontSize: 12}} />
            <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} />
            <YAxis
              yAxisId="rightRate"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
            
            {/* 👇 성공률 기준 30% 점선 */}
            <ReferenceLine 
              y={30} 
              yAxisId="rightRate" 
              stroke="red" 
              strokeDasharray="3 3" 
              label={{ position: 'right', value: '기준 (성공률 30%)', fill: 'red', fontSize: 12 }} 
            />

            {/* 막대 그래프: 전체 콜 수 */}
            <Bar yAxisId="left" dataKey="totalCalls" name="총 상담" barSize={20} fill="#9CA3AF" radius={[4, 4, 0, 0]} />
            
            {/* 꺾은선 그래프: 성공 수 */}
            <Line yAxisId="right" type="monotone" dataKey="successCount" name="성공" stroke="#2563EB" strokeWidth={3} dot={{r: 4}} />
            
            {/* 꺾은선 그래프: 실패 수 */}
            <Line yAxisId="right" type="monotone" dataKey="failCount" name="실패" stroke="#F97316" strokeWidth={2} />

            {/* 성공률 라인 */}
            <Line
              yAxisId="rightRate"
              type="monotone"
              dataKey="successRate"
              name="성공률(%)"
              stroke="#16A34A"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
