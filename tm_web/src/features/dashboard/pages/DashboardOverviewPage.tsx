// src/features/dashboard/pages/DashboardOverviewPage.tsx

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeaderCard } from "@/components/common/PageHeaderCard";

// 컴포넌트들
import { DashboardStatGrid } from "../components/DashboardStatGrid";
import { DashboardNoticeCard } from "../components/DashboardNoticeCard";
import { PerformanceChart } from "@/features/dashboard/components/PerformanceChart";

// 훅 및 유틸리티
import { useDashboardStats } from "../hooks/useDashboardStats";
import { formatToTime } from "@/lib/dateUtils";

export default function DashboardOverviewPage() {
  const { stats, isLoading, lastUpdated, refresh } = useDashboardStats();
  const callTrendData = stats?.chart ?? [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef2ff_0%,_#f8fafc_42%,_#ffffff_100%)] p-6 space-y-8">
      {/* 헤더 */}
      <PageHeaderCard
        title="대시보드"
        description="Global Vision TM 센터의 실시간 운영 현황입니다."
        right={
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <div className="flex flex-col items-end mr-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400">Last Updated</span>
              <span className="text-sm font-medium text-slate-700 font-mono tabular-nums">
                {formatToTime(lastUpdated)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              disabled={isLoading}
              className="h-9 w-9 rounded-full bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      {/* 📊 통계 카드 그리드 */}
      <DashboardStatGrid stats={stats} isLoading={isLoading} />

      {/* 📉 차트 및 공지사항 영역 */}
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-3">
          <DashboardNoticeCard rows={stats?.table ?? []} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-4">
          {callTrendData.length > 0 ? (
            <PerformanceChart data={callTrendData} />
          ) : (
            <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 text-center text-sm text-slate-400 shadow-sm">
              통화 추이 데이터가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
