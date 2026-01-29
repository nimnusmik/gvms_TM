import { useEffect, useState } from "react";
import { dashboardApi } from "../api/dashboardApi";
import { DashboardStats } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, PhoneCall, Activity, CheckCircle2, RefreshCw, BarChart3 } from "lucide-react";
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

  // 통계 카드 컴포넌트
  const StatCard = ({ title, value, icon: Icon, description, color, subColor }: any) => (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-l-4" style={{ borderLeftColor: subColor }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
            {isLoading ? (
                <span className="inline-block w-16 h-8 bg-gray-100 animate-pulse rounded"></span>
            ) : (
                value
            )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* 1. 헤더 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">대시보드</h2>
          <p className="text-muted-foreground mt-1">
            Global Vision TM 센터의 실시간 운영 현황입니다.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border shadow-sm">
          <div className="flex flex-col items-end mr-2">
             <span className="text-xs text-gray-400">마지막 업데이트</span>
             <span className="text-sm font-medium text-gray-700 font-mono">{lastUpdated || "-"}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchStats} disabled={isLoading} className="hover:bg-blue-50 hover:text-blue-600">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* 2. KPI 카드 영역 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="현재 접속 상담원"
          value={`${(stats?.active_agents || 0).toLocaleString()}명`}
          icon={Activity}
          color="text-green-600"
          subColor="#16a34a"
          description={`전체 인원의 ${Math.round(((stats?.active_agents || 0) / (stats?.total_agents || 1)) * 100)}%`}
        />
        <StatCard
          title="총 고객 DB"
          value={`${(stats?.total_customers || 0).toLocaleString()}건`} 
          icon={PhoneCall}
          color="text-blue-600"
          subColor="#2563eb"
          description="배정 가능한 전체 리드"
        />
        <StatCard
          title="상담 성공률"
          value={`${(stats?.success_rate || 0).toFixed(1)}%`}
          icon={CheckCircle2}
          color="text-orange-600"
          subColor="#ea580c"
          description="전체 대비 계약 성사율"
        />
        <StatCard
          title="총 등록 사원"
          value={`${(stats?.total_agents || 0).toLocaleString()}명`}
          icon={Users}
          color="text-slate-600"
          subColor="#475569"
          description="현재 등록된 상담원 수"
        />
      </div>

      {/* 3. 차트 및 공지사항 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-500"/>
                실시간 통화 추이
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200 m-4">
              <BarChart3 className="w-10 h-10 text-gray-300 mb-2"/>
              <p className="text-sm font-medium">데이터 수집 중입니다</p>
              <p className="text-xs text-gray-400">내일 통화 기록 기능이 구현되면 활성화됩니다.</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>시스템 공지사항</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                {[
                    { title: "시스템 정기 점검 안내", date: "2026.01.29", type: "notice" },
                    { title: "신규 상담원 등록 가이드 배포", date: "2026.01.28", type: "info" },
                    { title: "DB 업로드 기능 업데이트", date: "2026.01.27", type: "update" }
                ].map((item, i) => (
                    <div key={i} className="flex items-start pb-4 border-b last:border-0 last:pb-0">
                        <span className={`mt-1.5 w-2 h-2 rounded-full mr-3 shrink-0 
                            ${item.type === 'notice' ? 'bg-red-500' : item.type === 'update' ? 'bg-blue-500' : 'bg-gray-400'}`} 
                        />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 hover:underline cursor-pointer">{item.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.date}</p>
                        </div>
                    </div>
                ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}