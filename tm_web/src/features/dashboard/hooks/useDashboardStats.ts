import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { dashboardApi } from "../api/dashboardApi";
import type { DashboardStats } from "../types";

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("통계 로딩 실패:", error);
      toast.error("통계 로딩 실패");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, isLoading, lastUpdated, refresh };
}
