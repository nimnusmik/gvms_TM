// src/features/dashboard/pages/DashboardOverviewPage.tsx

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// 컴포넌트들
import { DashboardHeader } from "../components/DashboardHeader";
import { DashboardStatGrid } from "../components/DashboardStatGrid";
import { DashboardCallTrendCard } from "../components/DashboardCallTrendCard";
import { DashboardNoticeCard } from "../components/DashboardNoticeCard";

// 훅 및 유틸리티
import { useDashboardStats } from "../hooks/useDashboardStats";
import { formatToTime } from "@/lib/dateUtils"; // 👈 분리한 함수 사용

export default function DashboardOverviewPage() {
  const { stats, isLoading, lastUpdated, refresh } = useDashboardStats();

  return (
    <div className="p-6 space-y-6">
      
      {/* 🟢 상단 헤더 영역 (Flexbox 레이아웃) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        
        {/* 👈 [왼쪽 그룹] 제목 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <DashboardHeader />
        </div>
        
        {/* 👉 [오른쪽 그룹] 마지막 업데이트 정보 & 새로고침 버튼 */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border shadow-sm self-end md:self-auto">
          <div className="flex flex-col items-end mr-2">
            <span className="text-xs text-slate-400">마지막 업데이트</span>
            <span className="text-sm font-medium text-slate-700 font-mono tabular-nums">
              {/* 유틸리티 함수로 안전하게 변환 */}
              {formatToTime(lastUpdated)}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
            disabled={isLoading}
            className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

      </div>

      {/* 📊 통계 카드 그리드 */}
      <DashboardStatGrid stats={stats} isLoading={isLoading} />

      {/* 📉 차트 및 공지사항 영역 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <DashboardCallTrendCard />
        <DashboardNoticeCard />
      </div>
    </div>
  );
}
