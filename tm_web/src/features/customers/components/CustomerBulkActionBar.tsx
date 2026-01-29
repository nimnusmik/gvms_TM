import { Button } from "@/components/ui/button";

interface CustomerBulkActionBarProps {
  selectedCount: number;
  onAssign: () => void;
}

export function CustomerBulkActionBar({ selectedCount, onAssign }: CustomerBulkActionBarProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-between animate-fade-in-down">
      <span className="text-blue-800 font-semibold ml-2">
        <span className="text-xl font-bold">{selectedCount}</span>명 선택됨
      </span>
      <Button onClick={onAssign} className="bg-blue-600 hover:bg-blue-700">
        상담원 배정하기
      </Button>
    </div>
  );
}
