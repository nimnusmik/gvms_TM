// src/features/customers/pages/CustomerManagementPage.tsx

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";
import AssignAgentModal from '../../agents/components/AssignAgentModal';
import { CustomerToolbar } from "../components/CustomerToolbar";
import { CustomerTable } from "../components/CustomerTable";
import { CustomerBulkActionBar } from "../components/CustomerBulkActionBar";
import { useCustomerList } from "../hooks/useCustomerList";
import { customerApi } from "../api/customerApi";
import { agentApi } from "@/features/agents/api/agentApi";
import type { Agent } from "@/features/agents/types";

export default function CustomerManagementPage() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSecondaryModalOpen, setIsSecondaryModalOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isUploadProcessing, setIsUploadProcessing] = useState(false);

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
    statusFilter,
    setStatusFilter,
    agentFilter,
    setAgentFilter,
    secondaryStatusFilter,
    setSecondaryStatusFilter,
    secondaryAgentFilter,
    setSecondaryAgentFilter,
    applySearch,
    resetFilters,
    reloadPage,
    reloadFirstPage,
  } = useCustomerList();

  // 페이지나 필터가 바뀌면 선택 초기화
  useEffect(() => {
    setSelectedIds([]);
  }, [page, activeSearch, statusFilter, agentFilter, secondaryStatusFilter, secondaryAgentFilter]);

  // 담당자 목록 로딩 (필터용)
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

  // 1. 엑셀 업로드 핸들러
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 70 * 1024 * 1024) {
      toast.error("파일 크기는 70MB를 넘을 수 없습니다.");
      return;
    }
    
    if (!confirm(`'${file.name}' 파일을 업로드하시겠습니까? \n(대량 업로드 시 시간이 걸릴 수 있습니다)`)) {
      e.target.value = ""; 
      return;
    }
    
    setIsUploading(true);
    try {
      const response = await customerApi.uploadExcel(file);
      toast.success(response.message || "업로드가 완료되었습니다!");
      setIsUploadProcessing(true);
      reloadFirstPage();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "업로드 실패: 파일 형식을 확인해주세요.";
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 2. 검색 엔터키 핸들러
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applySearch();
    }
  };

  // 3. 전체 선택 핸들러
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? customers.map((c) => c.id) : []);
  };

  // 4. 개별 행 선택 핸들러
  const handleSelectRow = (id: number) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 5. 일괄 배정 핸들러 (모달 확인 누를 때 실행)
  const handleBulkAssign = async (agentId: string) => {
    try {
      await customerApi.bulkAssign({ ids: selectedIds, agent_id: agentId });
      toast.success(`성공적으로 ${selectedIds.length}명을 배정했습니다.`);
      setSelectedIds([]);
      setIsModalOpen(false); // 모달 닫기
      reloadPage();
    } catch (error) {
      toast.error("배정 중 오류가 발생했습니다.");
    }
  };

  // 6. ✨ [추가] 일괄 배정 취소 핸들러
  const handleBulkUnassign = async () => {
    if (!confirm(`선택한 ${selectedIds.length}명의 담당자 배정을 취소하시겠습니까?`)) {
      return;
    }

    try {
      await customerApi.bulkUnassign(selectedIds);
      toast.success("배정이 취소되었습니다.");
      
      setSelectedIds([]); // 선택 해제
      reloadPage();       // 목록 새로고침
    } catch (error) {
      toast.error("배정 취소 중 오류가 발생했습니다.");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`선택한 ${selectedIds.length}건을 삭제하시겠습니까?\n2차 배정이 있으면 함께 삭제됩니다.`)) {
      return;
    }

    try {
      await customerApi.bulkDelete(selectedIds);
      toast.success("선택된 항목이 삭제되었습니다.");
      setSelectedIds([]);
      reloadPage();
    } catch (error) {
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  };

  const selectedAssignments = customers.filter((assignment) => selectedIds.includes(assignment.id));
  const secondaryEligible = selectedAssignments.filter(
    (assignment) => assignment.status === "SUCCESS" && !assignment.secondary_assignment
  );

  const handleBulkAssignSecondary = async (agentId: string) => {
    if (secondaryEligible.length === 0) {
      toast.error("2차 배정 가능한 항목이 없습니다. (SUCCESS 상태만 가능)");
      return;
    }

    try {
      const results = await Promise.allSettled(
        secondaryEligible.map((assignment) => customerApi.assignSecondary(assignment.id, agentId))
      );

      const successCount = results.filter((result) => result.status === "fulfilled").length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`2차 배정 완료: ${successCount}건`);
      }
      if (failCount > 0) {
        toast.error(`2차 배정 실패: ${failCount}건`);
      }

      setSelectedIds([]);
      setIsSecondaryModalOpen(false);
      reloadPage();
    } catch (error) {
      toast.error("2차 배정 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateSecondaryStatus = async (secondaryId: number, status: string) => {
    try {
      await customerApi.updateAssignmentStatus(secondaryId, status);
      toast.success("2차 상태가 변경되었습니다.");
      reloadPage();
    } catch (error) {
      toast.error("2차 상태 변경 실패");
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* 상단 툴바 (검색, 필터, 업로드, DB초기화) */}
      <CustomerToolbar
        totalCount={totalCount}
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
        agentFilter={agentFilter}
        onAgentChange={setAgentFilter}
        secondaryStatusFilter={secondaryStatusFilter}
        onSecondaryStatusChange={setSecondaryStatusFilter}
        secondaryAgentFilter={secondaryAgentFilter}
        onSecondaryAgentChange={setSecondaryAgentFilter}
        agents={agents}
        uploadProcessing={isUploadProcessing}
        onDismissUploadProcessing={() => setIsUploadProcessing(false)}
        showReset={
          Boolean(activeSearch) ||
          statusFilter !== "ALL" ||
          agentFilter !== "ALL" ||
          secondaryStatusFilter !== "ALL" ||
          secondaryAgentFilter !== "ALL"
        }
        onReset={resetFilters}
      />

      {/* ✨ 일괄 작업 액션 바 (선택되었을 때만 표시) */}
      {selectedIds.length > 0 && (
        <CustomerBulkActionBar
          selectedCount={selectedIds.length}
          onAssign={() => setIsModalOpen(true)}
          onUnassign={handleBulkUnassign} // 👈 여기가 핵심! 연결되었습니다.
          onDelete={handleBulkDelete}
          secondaryCount={secondaryEligible.length}
          onAssignSecondary={() => setIsSecondaryModalOpen(true)}
        />
      )}

      {/* 메인 테이블 */}
      <CustomerTable
        customers={customers}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
        onUpdateSecondaryStatus={handleUpdateSecondaryStatus}
        onPrevPage={() => setPage(Math.max(1, page - 1))}
        onNextPage={() => setPage(Math.min(totalPages, page + 1))}
      />

      {/* 배정 모달 */}
      <AssignAgentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleBulkAssign}
        selectedCount={selectedIds.length}
      />

      <AssignAgentModal 
        isOpen={isSecondaryModalOpen}
        onClose={() => setIsSecondaryModalOpen(false)}
        onConfirm={handleBulkAssignSecondary}
        selectedCount={secondaryEligible.length}
        title="2차 담당자 배정"
        description="SUCCESS 상태의 항목만 2차 담당자 배정이 가능합니다."
        confirmLabel="2차 배정"
      />
    </div>
  );
}
