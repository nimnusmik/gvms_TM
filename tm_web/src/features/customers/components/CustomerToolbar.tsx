import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Search, UploadCloud, X } from "lucide-react";
import type { ChangeEvent, KeyboardEvent, RefObject } from "react";

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
  showReset,
  onReset,
}: CustomerToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">고객 DB 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            총 {totalCount}개의 리드가 조회되었습니다.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            className="hidden"
            accept=".xlsx, .xls"
          />

          <Button
            variant="default"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="shadow-sm"
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            {isUploading ? "업로드 중..." : "엑셀 업로드"}
          </Button>

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
          className="h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="ALL">모든 상태</option>
          <option value="NEW">접수 (NEW)</option>
          <option value="ASSIGNED">배정됨 (ASSIGNED)</option>
          <option value="SUCCESS">성공 (SUCCESS)</option>
          <option value="REJECT">거절 (REJECT)</option>
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
    </div>
  );
}
