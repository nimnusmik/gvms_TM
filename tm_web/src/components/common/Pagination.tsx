import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      {/* 이전 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        이전
      </Button>
      
      {/* 페이지 표시 ( 1 / 10 ) */}
      <span className="text-sm font-medium text-slate-600">
        Page {currentPage} of {totalPages === 0 ? 1 : totalPages}
      </span>

      {/* 다음 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
      >
        다음
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}