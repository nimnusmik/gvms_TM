import { Activity, CheckCircle2, PhoneCall } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "../types";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  color: string;
  accent: string;
  isLoading: boolean;
}

function StatCard({ title, value, description, icon: Icon, color, accent, isLoading }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden border border-slate-200/70 bg-white/90 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-1">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-600">
            {title}
          </CardTitle>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-900">
          {isLoading ? (
            <span className="inline-block w-24 h-8 bg-slate-100 animate-pulse rounded" />
          ) : (
            value
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2">{description}</p>
      </CardContent>
    </Card>
  );
}

interface DashboardStatGridProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

export function DashboardStatGrid({ stats, isLoading }: DashboardStatGridProps) {
  const activeAgents = stats?.active_agents || 0;
  const totalAgents = stats?.total_agents || 1;
  const newCustomers = stats?.new_customers || 0;
  const totalCustomers = stats?.total_customers || 0;
  const successRate = stats?.success_rate || 0;
  const todayTotalCalls = stats?.today_total_calls || 0;

  const cards: StatCardProps[] = [
    {
      title: "현재 접속 상담원/총 등록 사원",
      value: `${activeAgents.toLocaleString()} / ${totalAgents.toLocaleString()}명`,
      description: `가동률 ${Math.round((activeAgents / totalAgents) * 100)}%`,
      icon: Activity,
      color: "text-green-600",
      accent: "#16a34a",
      isLoading,
    },
    {
      title: "새로 배정 가능한 DB",
      value: `${newCustomers.toLocaleString()}건`,
      description: `총 DB 개수: ${totalCustomers.toLocaleString()}건`,
      icon: PhoneCall,
      color: "text-blue-600",
      accent: "#2563eb",
      isLoading,
    },
    {
      title: "상담 성공률",
      value: `${successRate.toFixed(1)}%`,
      description: "전체 대비 계약 성사율",
      icon: CheckCircle2,
      color: "text-orange-600",
      accent: "#ea580c",
      isLoading,
    },
    {
      title: "오늘 콜 수(총)",
      value: `${todayTotalCalls.toLocaleString()}건`,
      description: "오늘 발생한 전체 콜 수",
      icon: PhoneCall,
      color: "text-indigo-600",
      accent: "#4f46e5",
      isLoading,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
