// src/features/customers/pages/CustomerManagementPage.tsx
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";
import AssignAgentModal from "../components/AssignAgentModal";
import { CustomerToolbar } from "../components/CustomerToolbar";
import { CustomerTable } from "../components/CustomerTable";
import { CustomerBulkActionBar } from "../components/CustomerBulkActionBar";
import { useCustomerList } from "../hooks/useCustomerList";
import { customerApi } from "../api/customerApi";

export default function CustomerManagementPage() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    customers,
    isLoading,
    page,
    setPage,
    totalPages,
    searchTerm,
    setSearchTerm,
    activeSearch,
    statusFilter,
    setStatusFilter,
    applySearch,
    resetFilters,
    reloadPage,
    reloadFirstPage,
  } = useCustomerList();

  useEffect(() => {
    setSelectedIds([]);
  }, [page, activeSearch, statusFilter]);

  // ✨ [추가] 엑셀 업로드 핸들러
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 1. 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("파일 크기는 10MB를 넘을 수 없습니다.");
      return;
    }
    
    // 2. 확인 메시지
    if (!confirm(`'${file.name}' 파일을 업로드하시겠습니까? \n(대량 업로드 시 시간이 걸릴 수 있습니다)`)) {
      e.target.value = ""; // 취소 시 초기화
      return;
    }
    
    setIsUploading(true);
    try {
      // API 호출
      const response = await customerApi.uploadExcel(file);
      toast.success(response.message || "업로드가 완료되었습니다!");
      
      // 성공 시 목록 새로고침 (1페이지로 이동)
      reloadFirstPage();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "업로드 실패: 파일 형식을 확인해주세요.";
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
      // 파일 입력 초기화 (같은 파일 다시 올릴 수 있게)
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applySearch();
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? customers.map((c) => c.id) : []);
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAssign = async (agentId: string) => {
    await customerApi.bulkAssign({ ids: selectedIds, agent_id: agentId });
    toast.success(`성공적으로 ${selectedIds.length}명을 배정했습니다.`);
    setSelectedIds([]);
    reloadPage();
  };

  return (
    <div className="p-6 space-y-4">
      <CustomerToolbar
        totalCount={customers.length}
        isLoading={isLoading}
        isUploading={isUploading}
        fileInputRef={fileInputRef}
        onFileChange={handleFileUpload}
        onRefresh={reloadPage}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchKeyDown={handleSearchKeyDown}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        showReset={Boolean(activeSearch) || statusFilter !== "ALL"}
        onReset={resetFilters}
      />

      {/* 일괄 작업 액션 바 */}
      {selectedIds.length > 0 && (
        <CustomerBulkActionBar
          selectedCount={selectedIds.length}
          onAssign={() => setIsModalOpen(true)}
        />
      )}

      <CustomerTable
        customers={customers}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
        onPrevPage={() => setPage(Math.max(1, page - 1))}
        onNextPage={() => setPage(Math.min(totalPages, page + 1))}
      />

      <AssignAgentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleBulkAssign}
        selectedCount={selectedIds.length}
      />
    </div>
  );
}
