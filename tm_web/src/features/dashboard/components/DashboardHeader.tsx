import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  lastUpdated: string;
  isLoading: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({ lastUpdated, isLoading, onRefresh }: DashboardHeaderProps) {
  return (
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
          <span className="text-sm font-medium text-gray-700 font-mono">
            {lastUpdated || "-"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          className="hover:bg-blue-50 hover:text-blue-600"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>
    </div>
  );
}
