import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, RefreshCcw, Search, X } from "lucide-react";
import type { KeyboardEvent } from "react";
import { PageHeaderCard } from "@/components/common/PageHeaderCard";

interface RecycleCustomerToolbarProps {
  totalCount: number;
  isLoading: boolean;
  onRefresh: () => void;
  onExport: () => void;
  exporting: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearchKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  showReset: boolean;
  onReset: () => void;
}

export function RecycleCustomerToolbar({
  totalCount,
  isLoading,
  onRefresh,
  onExport,
  exporting,
  searchTerm,
  onSearchChange,
  onSearchKeyDown,
  showReset,
  onReset,
}: RecycleCustomerToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeaderCard
        title="재활용 DB"
        description={
          <>
            총 <span className="font-bold text-gray-900">{totalCount}</span>개의 재활용 DB가 조회되었습니다.
          </>
        }
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onExport} disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? "다운로드 중..." : "엑셀 다운로드"}
            </Button>
            <Button variant="outline" size="icon" onClick={onRefresh} title="새로고침">
              <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg border shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="고객명, 전화번호, 메모 검색 (Enter)"
            className="pl-9 bg-gray-50 border-gray-200"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onSearchKeyDown}
          />
        </div>

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
