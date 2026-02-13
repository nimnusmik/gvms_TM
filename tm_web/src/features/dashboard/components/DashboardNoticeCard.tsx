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

const parseTimeToSeconds = (value: string) => {
  const parts = value.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return Number.MAX_SAFE_INTEGER;
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  return Number.MAX_SAFE_INTEGER;
};

export function DashboardNoticeCard({ rows, isLoading }: DashboardNoticeCardProps) {
  const topThree = [...rows]
    .sort((a, b) => {
      if (b.contractCount !== a.contractCount) return b.contractCount - a.contractCount;
      if (b.successRate !== a.successRate) return b.successRate - a.successRate;
      return parseTimeToSeconds(a.avgCallTime) - parseTimeToSeconds(b.avgCallTime);
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
          <div className="space-y-3">
            {topThree.map((row, index) => {
              const style = rankStyles[index];
              const Icon = style.icon;
              const isLeader = index === 0;
              const leader = topThree[0];
              const contractGap = isLeader ? 0 : (leader?.contractCount ?? 0) - row.contractCount;
              const sameContract = leader?.contractCount === row.contractCount;
              const sameSuccessRate = leader?.successRate === row.successRate;
              const successCount = row.successCount ?? row.contractCount ?? 0;
              const rejectCount = row.rejectCount ?? 0;
              const absenceCount = row.absenceCount ?? 0;
              const invalidCount = row.invalidCount ?? 0;
              const tieNote = !isLeader && sameContract
                ? sameSuccessRate
                  ? "공동 1위"
                  : "성공률 차이로 2위"
                : null;
              return (
                <div
                  key={`${row.name}-${index}`}
                  className={`group rounded-2xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    isLeader
                      ? "border-amber-200/70 bg-gradient-to-r from-amber-50 via-white to-amber-50"
                      : "border-slate-100 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${style.badge} ring-1 ${style.ring}`}
                    >
                      <Icon className={`h-4 w-4 ${style.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold ${isLeader ? "text-amber-700" : "text-slate-500"}`}>
                          {style.label}
                        </span>
                        <span className="truncate text-[15px] font-semibold text-slate-900">
                          {row.name}
                        </span>
                      </div>
                      <div className="mt-2 flex items-end justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-[11px] font-semibold text-slate-500">계약</span>
                            <span className="text-2xl font-bold text-slate-900">{row.contractCount}</span>
                            <span className="text-[11px] font-semibold text-slate-500">건</span>
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">
                            동의 {successCount} · 거절 {rejectCount} · 부재 {absenceCount} · 결번 {invalidCount}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 text-[11px]">
                          {!isLeader && tieNote && (
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[12px] font-semibold text-indigo-600">
                              {tieNote}
                            </span>
                          )}
                          {!isLeader && !tieNote && contractGap > 0 && (
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[12px] font-semibold text-rose-600">
                              1위와 {contractGap}건 차이
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">평균 통화</span>
                            <span className="text-[12px] font-semibold text-slate-700">{row.avgCallTime}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-700">
                            <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-600/70">성공률</span>
                            <span className="text-[12px] font-semibold">{row.successRate}%</span>
                          </div>
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
