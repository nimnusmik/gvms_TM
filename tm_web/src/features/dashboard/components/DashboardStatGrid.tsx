import { Activity, CheckCircle2, PhoneCall, Users } from "lucide-react";
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
    <Card
      className="shadow-sm hover:shadow-md transition-shadow duration-200 border-l-4"
      style={{ borderLeftColor: accent }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {isLoading ? (
            <span className="inline-block w-16 h-8 bg-gray-100 animate-pulse rounded" />
          ) : (
            value
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
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
  const totalCustomers = stats?.total_customers || 0;
  const successRate = stats?.success_rate || 0;

  const cards: StatCardProps[] = [
    {
      title: "현재 접속 상담원",
      value: `${activeAgents.toLocaleString()}명`,
      description: `전체 인원의 ${Math.round((activeAgents / totalAgents) * 100)}%`,
      icon: Activity,
      color: "text-green-600",
      accent: "#16a34a",
      isLoading,
    },
    {
      title: "총 고객 DB",
      value: `${totalCustomers.toLocaleString()}건`,
      description: "배정 가능한 전체 리드",
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
      title: "총 등록 사원",
      value: `${(stats?.total_agents || 0).toLocaleString()}명`,
      description: "현재 등록된 상담원 수",
      icon: Users,
      color: "text-slate-600",
      accent: "#475569",
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
