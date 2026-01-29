import { DashboardHeader } from "../components/DashboardHeader";
import { DashboardStatGrid } from "../components/DashboardStatGrid";
import { DashboardCallTrendCard } from "../components/DashboardCallTrendCard";
import { DashboardNoticeCard } from "../components/DashboardNoticeCard";
import { useDashboardStats } from "../hooks/useDashboardStats";

export default function DashboardOverviewPage() {
  const { stats, isLoading, lastUpdated, refresh } = useDashboardStats();

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader lastUpdated={lastUpdated} isLoading={isLoading} onRefresh={refresh} />

      <DashboardStatGrid stats={stats} isLoading={isLoading} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <DashboardCallTrendCard />
        <DashboardNoticeCard />
      </div>
    </div>
  );
}
