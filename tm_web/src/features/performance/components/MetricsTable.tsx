type MetricsRow = {
  name: string;
  successRate: number;
  avgCallTime: string;
  contractCount: number;
};

type MetricsTableProps = {
  data: MetricsRow[];
};

export const MetricsTable = ({ data }: MetricsTableProps) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-full min-h-[22rem] flex flex-col">
      <h3 className="font-bold text-gray-800 mb-4">사원별 주요 지표</h3>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
            <tr>
              <th className="py-3 px-4">사원명</th>
              <th className="py-3 px-4 text-center">성공률</th>
              <th className="py-3 px-4 text-center">평균 통화</th>
              <th className="py-3 px-4 text-center">계약 수</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-800">{row.name}</td>
                <td className="py-3 px-4 text-center text-blue-600 font-bold">{row.successRate}%</td>
                <td className="py-3 px-4 text-center text-gray-600">{row.avgCallTime}</td>
                <td className="py-3 px-4 text-center font-bold">{row.contractCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
