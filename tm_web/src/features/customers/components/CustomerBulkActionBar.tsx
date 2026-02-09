import { Button } from "@/components/ui/button";
import { Trash2, XCircle, UserPlus } from "lucide-react";

interface CustomerBulkActionBarProps {
  selectedCount: number;
  onAssign: () => void;
  onUnassign: () => void;
  onDelete: () => void;
  secondaryCount: number;
  onAssignSecondary: () => void;
}

export function CustomerBulkActionBar({
  selectedCount,
  onAssign,
  onUnassign,
  onDelete,
  secondaryCount,
  onAssignSecondary,
}: CustomerBulkActionBarProps) {
  return (
    <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-4 rounded-lg animate-in slide-in-from-top-2">
      <div className="flex items-center gap-2">
        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
          {selectedCount}
        </span>
        <span className="text-blue-900 font-medium text-sm">
          명 선택됨
        </span>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onAssignSecondary}
          disabled={secondaryCount === 0}
          className="border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 disabled:opacity-50"
          title={secondaryCount === 0 ? "SUCCESS 상태만 2차 배정 가능합니다." : undefined}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          2차 배정하기 ({secondaryCount})
        </Button>

        {/* 👇 [추가] 배정 취소 버튼 */}
        <Button
          variant="outline" // 흰색 배경
          size="sm"
          onClick={onUnassign}
          className="border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
        >
          <XCircle className="w-4 h-4 mr-2" />
          배정 취소
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          선택 삭제
        </Button>

        {/* 기존 배정 버튼 */}
        <Button 
          size="sm" 
          onClick={onAssign}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          상담원 배정하기
        </Button>
      </div>
    </div>
  );
}
