import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-full">
      <h3 className="font-bold text-gray-800 mb-4">시간별/아이템별 성과 추이</h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{fontSize: 12}} />
            <YAxis yAxisId="left" tick={{fontSize: 12}} />
            <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
            
            {/* 막대 그래프: 전체 콜 수 or 실패 수 */}
            <Bar yAxisId="left" dataKey="totalCalls" name="총 상담" barSize={20} fill="#E5E7EB" radius={[4, 4, 0, 0]} />
            
            {/* 꺾은선 그래프: 성공 수 */}
            <Line yAxisId="left" type="monotone" dataKey="successCount" name="성공" stroke="#2563EB" strokeWidth={3} dot={{r: 4}} />
            
            {/* 꺾은선 그래프: 실패 수 (선택) */}
            <Line yAxisId="left" type="monotone" dataKey="failCount" name="실패" stroke="#F97316" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
