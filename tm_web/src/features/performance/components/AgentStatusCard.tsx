import { Phone, Clock, Target } from 'lucide-react';

// 상태별 뱃지 색상 매핑
const STATUS_COLORS: Record<string, string> = {
  BUSY: 'bg-green-100 text-green-700 border-green-200', // 통화중
  ONLINE: 'bg-yellow-100 text-yellow-700 border-yellow-200', // 대기중 (온라인)
  BREAK: 'bg-gray-100 text-gray-600 border-gray-200', // 휴식
};

const STATUS_LABELS: Record<string, string> = {
  BUSY: '상담 중',
  ONLINE: '대기 중',
  BREAK: '휴식 중',
};

type AgentStatus = {
  id?: number | string;
  name: string;
  team?: string | null;
  status: string;
  avatar?: string | null;
  todayCalls: number;
  dailyGoal: number;
  successRate: number;
  totalCallTime: string;
};

type AgentStatusCardProps = {
  agent: AgentStatus;
};

export const AgentStatusCard = ({ agent }: AgentStatusCardProps) => {
  const statusColor = STATUS_COLORS[agent.status] || 'bg-gray-100 text-gray-500';
  const safeGoal = agent.dailyGoal || 0;
  const progressPercent = safeGoal > 0 ? Math.min((agent.todayCalls / safeGoal) * 100, 100) : 0;
  const isSalesMain = agent.team === 'SALES_MAIN';
  const isSalesTm = agent.team === 'SALES_TM';

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
        isSalesMain
          ? 'border-rose-400 bg-white'
          : isSalesTm
            ? 'border-blue-300 bg-white'
            : 'border-gray-200 bg-white'
      }`}
    >
      {/* 헤더: 이름, 팀, 상태뱃지 */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
             {/* 프로필 이미지 (없으면 이니셜) */}
            <img src={agent.avatar || "https://placehold.co/100"} alt="profile" className="w-full h-full object-cover"/>
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">{agent.name}</h3>
            <p className="text-sm text-gray-500">{agent.team}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
          {STATUS_LABELS[agent.status] || agent.status}
        </span>
      </div>

      {/* 메트릭: 콜수, 성공률, 통화시간 */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center divide-x divide-gray-100">
        <div>
          <p className="text-xs text-gray-400 mb-1 flex justify-center items-center gap-1"><Phone size={12}/> 금일 콜 수</p>
          <p className="font-bold text-gray-800 text-lg">{agent.todayCalls}건</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1 flex justify-center items-center gap-1"><Target size={12}/> 성공률</p>
          <p className="font-bold text-gray-800 text-lg">{agent.successRate}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1 flex justify-center items-center gap-1"><Clock size={12}/> 총 통화</p>
          <p className="font-bold text-gray-800 text-lg">{agent.totalCallTime}</p>
        </div>
      </div>

      {/* 목표 달성 프로그레스 바 */}
      <div className="mt-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500 font-medium">일일 목표 달성</span>
          <span className="text-blue-600 font-bold">{agent.todayCalls} / {agent.dailyGoal}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
