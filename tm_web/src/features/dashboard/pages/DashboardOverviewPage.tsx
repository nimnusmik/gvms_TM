import { useEffect, useState } from "react";
import { dashboardApi } from "../api/dashboardApi";
import { DashboardStats } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, PhoneCall, Activity, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("통계 로딩 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 통계 카드 컴포넌트 (재사용)
  const StatCard = ({ title, value, icon: Icon, description, color }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{isLoading ? "-" : value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* 1. 헤더 영역 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">대시보드</h2>
          <p className="text-muted-foreground mt-1">
            TM 센터의 실시간 현황을 모니터링합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            마지막 업데이트: {lastUpdated}
          </span>
          <Button variant="outline" size="icon" onClick={fetchStats} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* 2. KPI 카드 영역 (4열 배치) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="현재 접속 상담원"
          value={`${stats?.active_agents || 0}명`}
          icon={Activity}
          color="text-green-500"
          description={`총 ${stats?.total_agents || 0}명 중 접속 중`}
        />
        <StatCard
          title="오늘 총 통화량"
          value={`${stats?.total_calls || 0}건`}
          icon={PhoneCall}
          color="text-blue-500"
          description="전일 대비 +0% (데이터 없음)"
        />
        <StatCard
          title="상담 성공률"
          value={`${stats?.success_rate || 0}%`}
          icon={CheckCircle2}
          color="text-orange-500"
          description="목표 달성률 0%"
        />
        <StatCard
          title="총 등록 사원"
          value={`${stats?.total_agents || 0}명`}
          icon={Users}
          color="text-slate-500"
          description="전체 상담원 인원"
        />
      </div>

      {/* 3. 상세 현황 영역 (추후 그래프 등이 들어갈 자리) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>실시간 통화 추이</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-slate-50 rounded-md border border-dashed">
              차트 영역 (준비 중)
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>공지사항 / 알림</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <p className="text-sm">시스템 정기 점검 안내</p>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <p className="text-sm">신규 상담원 등록 가이드 배포</p>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}