import { useEffect, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { CustomerTable } from "../components/CustomerTable";
import { useCustomerList } from "../hooks/useCustomerList";
import { agentApi } from "@/features/agents/api/agentApi";
import type { Agent } from "@/features/agents/types";
import { SuccessCustomerToolbar } from "../components/SuccessCustomerToolbar";
import { customerApi } from "../api/customerApi";

export default function FirstSuccessCustomerPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [exporting, setExporting] = useState(false);

  const {
    customers,
    isLoading,
    page,
    setPage,
    totalPages,
    totalCount,
    searchTerm,
    setSearchTerm,
    activeSearch,
    agentFilter,
    setAgentFilter,
    secondaryStatusFilter,
    setSecondaryStatusFilter,
    secondaryAgentFilter,
    setSecondaryAgentFilter,
    applySearch,
    resetFilters,
    reloadPage,
  } = useCustomerList({ initialStatus: "SUCCESS", lockedStatus: "SUCCESS" });

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await agentApi.getAgents();
        setAgents(data);
      } catch (error) {
        console.error(error);
        toast.error("담당자 목록 로딩 실패");
      }
    };
    fetchAgents();
  }, []);

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applySearch();
    }
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const response = await customerApi.exportSuccessDb({
        search: activeSearch || undefined,
        agentId: agentFilter !== "ALL" ? agentFilter : undefined,
        secondaryStatus: secondaryStatusFilter !== "ALL" ? secondaryStatusFilter : undefined,
        secondaryAgentId: secondaryAgentFilter !== "ALL" ? secondaryAgentFilter : undefined,
      });
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `success_db_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("엑셀 다운로드 완료");
    } catch (error) {
      console.error("엑셀 다운로드 실패:", error);
      toast.error("엑셀 다운로드 실패");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <SuccessCustomerToolbar
        totalCount={totalCount}
        isLoading={isLoading}
        onRefresh={reloadPage}
        onExport={handleExport}
        exporting={exporting}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchKeyDown={handleSearchKeyDown}
        agentFilter={agentFilter}
        onAgentChange={setAgentFilter}
        secondaryStatusFilter={secondaryStatusFilter}
        onSecondaryStatusChange={setSecondaryStatusFilter}
        secondaryAgentFilter={secondaryAgentFilter}
        onSecondaryAgentChange={setSecondaryAgentFilter}
        agents={agents}
        showReset={
          Boolean(activeSearch) ||
          agentFilter !== "ALL" ||
          secondaryStatusFilter !== "ALL" ||
          secondaryAgentFilter !== "ALL"
        }
        onReset={resetFilters}
      />

      <CustomerTable
        customers={customers}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        onPrevPage={() => setPage(Math.max(1, page - 1))}
        onNextPage={() => setPage(Math.min(totalPages, page + 1))}
        readOnly
        showSelection={false}
      />
    </div>
  );
}
