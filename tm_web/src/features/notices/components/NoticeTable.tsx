import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Megaphone, Pin, Trash2 } from "lucide-react";
import type { Notice } from "../types";

interface NoticeTableProps {
  notices: Notice[];
  isLoading: boolean;
  onRowClick: (notice: Notice) => void;
  onDelete: (id: number) => void;
}

export function NoticeTable({ notices, isLoading, onRowClick, onDelete }: NoticeTableProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[80px] text-center">번호</TableHead>
            <TableHead className="w-[100px] text-center">구분</TableHead>
            <TableHead>제목</TableHead>
            <TableHead className="w-[120px] text-center">작성자</TableHead>
            <TableHead className="w-[150px] text-center">작성일</TableHead>
            <TableHead className="w-[80px] text-center">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-20 text-gray-400">
                데이터 로딩 중...
              </TableCell>
            </TableRow>
          ) : notices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-20 text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <Megaphone className="w-8 h-8 text-gray-300" />
                  <p>등록된 공지사항이 없습니다.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            notices.map((notice, index) => (
              <TableRow
                key={notice.id}
                className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                onClick={() => onRowClick(notice)}
              >
                <TableCell className="text-center font-medium text-gray-500">
                  {notice.is_important ? (
                    <Pin className="w-4 h-4 text-red-500 mx-auto fill-red-500/10" />
                  ) : (
                    notices.length - index
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {notice.is_important ? (
                    <Badge
                      variant="destructive"
                      className="bg-red-50 text-red-600 border-red-100 shadow-none hover:bg-red-100"
                    >
                      필독
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500 border-gray-200 font-normal">
                      일반
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col py-1">
                    <span
                      className={cn(
                        "text-sm",
                        notice.is_important ? "font-bold text-gray-900" : "font-medium text-gray-700"
                      )}
                    >
                      {notice.title}
                    </span>
                    <span className="text-xs text-gray-400 truncate max-w-[400px] mt-0.5">
                      {notice.content}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center text-sm text-gray-600">
                  {notice.author_name || "관리자"}
                </TableCell>
                <TableCell className="text-center text-sm text-gray-500 font-mono">
                  {new Date(notice.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(notice.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
