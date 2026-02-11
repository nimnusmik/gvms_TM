import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Crown, Flame, Trophy } from "lucide-react";
import type { MetricsRow } from "@/features/performance/types";

type DashboardNoticeCardProps = {
  rows: MetricsRow[];
  isLoading: boolean;
};

const rankStyles = [
  {
    label: "1위",
    badge: "from-amber-400 via-yellow-300 to-amber-500",
    ring: "ring-amber-200",
    text: "text-amber-900",
    icon: Crown,
  },
  {
    label: "2위",
    badge: "from-slate-300 via-slate-200 to-slate-300",
    ring: "ring-slate-200",
    text: "text-slate-800",
    icon: Trophy,
  },
  {
    label: "3위",
    badge: "from-orange-200 via-amber-200 to-orange-200",
    ring: "ring-orange-200",
    text: "text-orange-900",
    icon: Flame,
  },
];

export function DashboardNoticeCard({ rows, isLoading }: DashboardNoticeCardProps) {
  const topThree = [...rows]
    .sort((a, b) => {
      if (b.contractCount !== a.contractCount) return b.contractCount - a.contractCount;
      return b.successRate - a.successRate;
    })
    .slice(0, 3);

  return (
    <Card className="col-span-full lg:col-span-3 h-full border border-slate-200/70 bg-white/90 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <CardTitle className="text-base font-bold text-slate-900">
            오늘의 Top 3 성과자
          </CardTitle>
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 hover:text-amber-600" asChild>
          <Link to="/dashboard/Performance">
            성과 상세 보기
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-10 text-center text-sm text-slate-400">
            성과 데이터를 불러오는 중...
          </div>
        ) : topThree.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center text-slate-400 gap-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm">오늘의 성과 데이터를 준비 중입니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topThree.map((row, index) => {
              const style = rankStyles[index];
              const Icon = style.icon;
              return (
                <div
                  key={`${row.name}-${index}`}
                  className="group rounded-2xl border border-slate-100 bg-gradient-to-r from-white via-slate-50 to-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${style.badge} ring-1 ${style.ring}`}
                    >
                      <Icon className={`h-4 w-4 ${style.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">{style.label}</span>
                        <span className="truncate text-sm font-semibold text-slate-800">
                          {row.name}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          평균 통화 {row.avgCallTime}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-white px-2.5 py-2 text-xs">
                          <span className="font-semibold text-emerald-600">성공률</span>
                          <span className="text-sm font-bold text-emerald-700">{row.successRate}%</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-amber-200/70 bg-amber-50 px-2.5 py-2 text-xs">
                          <span className="font-semibold text-amber-700">계약</span>
                          <span className="text-sm font-bold text-amber-800">{row.contractCount}건</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
