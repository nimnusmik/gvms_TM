// src/features/customers/components/CustomerToolbar.tsx

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Search, UploadCloud, X, Loader2, Info } from "lucide-react";
import type { ChangeEvent, KeyboardEvent, RefObject } from "react";

import { CustomerResetDialog } from "./CustomerResetDialog";
import type { Agent } from "@/features/agents/types";

interface CustomerToolbarProps {
  totalCount: number;
  isLoading: boolean;
  isUploading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRefresh: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearchKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  agentFilter: string;
  onAgentChange: (value: string) => void;
  agents: Agent[];
  uploadProcessing: boolean;
  onDismissUploadProcessing: () => void;
  showReset: boolean;
  onReset: () => void;
}

export function CustomerToolbar({
  totalCount,
  isLoading,
  isUploading,
  fileInputRef,
  onFileChange,
  onRefresh,
  searchTerm,
  onSearchChange,
  onSearchKeyDown,
  statusFilter,
  onStatusChange,
  agentFilter,
  onAgentChange,
  agents,
  uploadProcessing,
  onDismissUploadProcessing,
  showReset,
  onReset,
}: CustomerToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* 상단 헤더 영역 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">고객 DB 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            총 <span className="font-bold text-gray-900">{totalCount}</span>개의 리드가 조회되었습니다.
          </p>
        </div>

        {/* 우측 상단 액션 버튼 그룹 */}
        <div className="flex gap-2">
          {/* ✨ 1. DB 초기화 버튼 추가 (성공 시 onRefresh 호출하여 목록 갱신) */}
          <CustomerResetDialog onSuccess={onRefresh} />

          {/* 2. 엑셀 업로드 (Hidden Input + Button) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            className="hidden"
            accept=".xlsx, .xls"
          />

          <Button
            variant="default"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="shadow-sm gap-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            {isUploading ? "업로드 중..." : "엑셀 업로드"}
          </Button>

          {/* 3. 새로고침 버튼 */}
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            title="새로고침"
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* 하단 검색 및 필터 영역 */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg border shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="고객명, 전화번호 검색 (Enter)"
            className="pl-9 bg-gray-50 border-gray-200"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onSearchKeyDown}
          />
        </div>

        <select
          className="customer-filter-select"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="ALL">모든 상태</option>
          <option value="NEW">접수 (NEW)</option>
          <option value="ASSIGNED">배정됨 (ASSIGNED)</option>
          <option value="SUCCESS">성공 (SUCCESS)</option>
          <option value="REJECT">거절 (REJECT)</option>
        </select>

        <select
          className="customer-filter-select"
          value={agentFilter}
          onChange={(e) => onAgentChange(e.target.value)}
        >
          <option value="ALL">담당자 전체</option>
          {agents.map((agent) => (
            <option key={agent.agent_id} value={String(agent.agent_id)}>
              {agent.name} ({agent.code})
            </option>
          ))}
        </select>

        {showReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" /> 초기화
          </Button>
        )}
      </div>

      {uploadProcessing && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-semibold">대용량 엑셀 처리 중</span>
            <span className="text-amber-800/80">
              백그라운드에서 처리 중입니다. 완료 후 새로고침 해주세요.
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismissUploadProcessing}
            className="text-amber-900 hover:bg-amber-100"
            title="알림 닫기"
          >
            <Info className="mr-1 h-4 w-4" /> 확인
          </Button>
        </div>
      )}
    </div>
  );
}
