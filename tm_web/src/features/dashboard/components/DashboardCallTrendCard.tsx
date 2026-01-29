import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardCallTrendCard() {
  return (
    <Card className="col-span-4 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-500" />
          실시간 통화 추이
        </CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200 m-4">
          <BarChart3 className="w-10 h-10 text-gray-300 mb-2" />
          <p className="text-sm font-medium">데이터 수집 중입니다</p>
          <p className="text-xs text-gray-400">내일 통화 기록 기능이 구현되면 활성화됩니다.</p>
        </div>
      </CardContent>
    </Card>
  );
}
