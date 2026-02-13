import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { MetricsTable } from "../components/MetricsTable";
import { AgentStatusCard } from "../components/AgentStatusCard";
import { AgentTrendChart } from "../components/AgentTrendChart";
import { AgentCard, PerformanceData } from  "../types/index"

export default function PerformancePage() {
  // 상태 관리
  const [data, setData] = useState<PerformanceData>({
    cards: [],
    table: [],
    chart: [],
    agentTrends: undefined
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 데이터 불러오기
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsResult, agentsResult] = await Promise.allSettled([
          api.get('/agents/dashboard_stats/'),
          api.get('/agents/')
        ]);

        const stats =
          statsResult.status === 'fulfilled' ? (statsResult.value.data ?? {}) : {};

        const agents =
          agentsResult.status === 'fulfilled' && Array.isArray(agentsResult.value.data)
            ? agentsResult.value.data
            : [];

        const statsCards = Array.isArray(stats.cards) ? stats.cards : [];

        const cards: AgentCard[] =
          statsCards.length > 0
            ? statsCards
            : agents.map((agent: any) => ({
                id: agent.agent_id ?? agent.id,
                name: agent.name ?? '이름 없음',
                team: agent.team ?? null,
                status: agent.status ?? 'OFFLINE',
                avatar: null,
                todayCalls: 0,
                dailyGoal: agent.daily_cap ?? 0,
                successRate: 0,
                totalCallTime: '0:00'
              }));

        setData({
          cards,
          table: stats.table ?? [],
          chart: stats.chart ?? [],
          agentTrends: stats.agent_trends ?? undefined
        });
        setLastUpdated(new Date());
      } catch (error) {
        console.error("통계 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // 10초마다 자동 갱신 (실시간 대시보드 느낌)
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-6">데이터를 불러오는 중...</div>;

  const totalAgents = data.cards.length;
  const onlineCount = data.cards.filter((a) => a.status === 'ONLINE').length;
  const busyCount = data.cards.filter((a) => a.status === 'BUSY').length;
  const breakCount = data.cards.filter((a) => a.status === 'BREAK').length;
  const offlineCount = data.cards.filter((a) => a.status === 'OFFLINE' || a.status === 'RESIGNED').length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white p-6 shadow-lg border border-slate-700/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">성과 현황</h1>
            <p className="mt-1 text-sm text-slate-200/80">
              상담원 운영 상태와 실시간 지표를 한 화면에서 확인합니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200/80">
            <span className="rounded-full bg-white/10 px-3 py-1">
              총원 {totalAgents}명
            </span>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">
              ONLINE {onlineCount}
            </span>
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-amber-200">
              BUSY {busyCount}
            </span>
            <span className="rounded-full bg-slate-500/20 px-3 py-1 text-slate-200">
              BREAK {breakCount}
            </span>
            <span className="rounded-full bg-slate-700/40 px-3 py-1 text-slate-300">
              OFFLINE {offlineCount}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              업데이트: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. 상단 구역 */}
      <div className="mt-8">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">사원별 실시간 현황 카드</h3>
            <p className="text-sm text-gray-500 mt-1">현재 상태와 목표 달성 진행도를 확인하세요.</p>
          </div>
        </div>
        {data.cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400">
            표시할 상담원 카드가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.cards.map((agent) => (
              <AgentStatusCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>

      {/* 3. 하단 구역 */}
      <div className="mt-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">성과 상세 지표</h3>
            <p className="text-sm text-gray-500 mt-1">개별 지표와 추이를 함께 비교합니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
          <div className="lg:col-span-5 h-full">
            <MetricsTable data={data.table} />
          </div>
          <div className="lg:col-span-7 h-full">
            <AgentTrendChart data={data.agentTrends} />
          </div>
        </div>
      </div>

    </div>
  );
}
