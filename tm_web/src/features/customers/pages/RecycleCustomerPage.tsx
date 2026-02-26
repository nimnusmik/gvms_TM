import { useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { CustomerTable } from "../components/CustomerTable";
import { RecycleCustomerToolbar } from "../components/RecycleCustomerToolbar";
import { useRecycleCustomerList } from "../hooks/useRecycleCustomerList";
import { customerApi } from "../api/customerApi";

export default function RecycleCustomerPage() {
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
    applySearch,
    resetFilters,
    reloadPage,
  } = useRecycleCustomerList();

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applySearch();
    }
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const response = await customerApi.exportRecycleDb({
        search: activeSearch || undefined,
      });
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recycle_db_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
      <RecycleCustomerToolbar
        totalCount={totalCount}
        isLoading={isLoading}
        onRefresh={reloadPage}
        onExport={handleExport}
        exporting={exporting}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchKeyDown={handleSearchKeyDown}
        showReset={Boolean(activeSearch)}
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
