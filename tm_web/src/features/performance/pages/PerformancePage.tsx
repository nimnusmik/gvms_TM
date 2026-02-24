import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { MetricsTable } from "../components/MetricsTable";
import { AgentStatusCard } from "../components/AgentStatusCard";
import { AgentTrendChart } from "../components/AgentTrendChart";
import { AgentCard, PerformanceData } from  "../types/index"
import { PageHeaderCard } from "@/components/common/PageHeaderCard";

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
  const [tableDays, setTableDays] = useState(7);

  // 데이터 불러오기
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsResult, agentsResult] = await Promise.allSettled([
          api.get('/agents/dashboard_stats/', {
            params: {
              table_days: tableDays
            }
          }),
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
  }, [tableDays]);

  if (loading) return <div className="p-6">데이터를 불러오는 중...</div>;

  const totalAgents = data.cards.length;
  const onlineCount = data.cards.filter((a) => a.status === 'ONLINE').length;
  const busyCount = data.cards.filter((a) => a.status === 'BUSY').length;
  const breakCount = data.cards.filter((a) => a.status === 'BREAK').length;
  const offlineCount = data.cards.filter((a) => a.status === 'OFFLINE' || a.status === 'RESIGNED').length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeaderCard
        title="성과 현황"
        description="상담원 운영 상태와 실시간 지표를 한 화면에서 확인합니다."
        variant="dark"
        right={
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              총원 {totalAgents}명
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              ONLINE {onlineCount}
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
              BUSY {busyCount}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
              BREAK {breakCount}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
              OFFLINE {offlineCount}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
              업데이트: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'}
            </span>
          </div>
        }
      />

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

          <div className="lg:col-span-6 h-full">
            <MetricsTable
              data={data.table}
              headerRight={(
                <div className="flex items-center rounded-full bg-gray-100 p-1">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setTableDays(days)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        tableDays === days
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:bg-white'
                      }`}
                    >
                      최근 {days}일
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
          <div className="lg:col-span-6 h-full">
            <AgentTrendChart data={data.agentTrends} />
          </div>
        </div>
      </div>

    </div>
  );
}
