import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

interface NoticeToolbarProps {
  totalCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
}

export function NoticeToolbar({
  totalCount,
  searchTerm,
  onSearchChange,
  onCreateClick,
}: NoticeToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">공지사항 게시판</h1>
          <p className="text-sm text-gray-500 mt-1">
            시스템 전체 공지 및 중요 사항을 관리합니다.
          </p>
        </div>
        <Button onClick={onCreateClick} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> 공지 작성
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white p-3 rounded-lg border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="제목, 작성자로 검색..."
            className="pl-9 bg-gray-50 border-gray-200"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-500 ml-auto px-2">
          총 <span className="font-bold text-blue-600">{totalCount}</span>개의 공지
        </div>
      </div>
    </div>
  );
}
