import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardCallTrendCard() {
  return (
    <Card className="col-span-4 border border-slate-200/70 bg-white/90 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base text-slate-800">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          실시간 통화 추이
        </CardTitle>
        <span className="text-xs text-slate-400">최근 7일 기준</span>
      </CardHeader>
      <CardContent className="pl-0">
        <div className="mx-4 mb-4 rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
            <BarChart3 className="h-6 w-6 text-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">데이터 수집 중입니다</p>
          <p className="mt-1 text-xs text-slate-400">
            통화 기록 기능이 활성화되면 차트가 표시됩니다.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            실시간 집계 대기 중
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
