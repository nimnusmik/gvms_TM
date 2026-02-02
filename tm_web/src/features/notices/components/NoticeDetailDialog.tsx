import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, User } from "lucide-react";
import type { Notice } from "../types";

interface NoticeDetailDialogProps {
  notice: Notice | null;
  onClose: () => void;
}

export function NoticeDetailDialog({ notice, onClose }: NoticeDetailDialogProps) {
  return (
    <Dialog open={!!notice} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] bg-white max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            {notice?.is_important && (
              <Badge variant="destructive" className="bg-red-100 text-red-600 hover:bg-red-200 border-0">
                중요 공지
              </Badge>
            )}
            <span className="text-xs text-gray-500 ml-auto flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
              <Calendar className="w-3 h-3" />
              {notice && new Date(notice.created_at).toLocaleString()}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900 leading-relaxed">
            {notice?.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 mt-2 pb-4 border-b">
            <User className="w-4 h-4" />
            작성자: <span className="font-medium text-gray-900">{notice?.author_name || "관리자"}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 text-gray-800 leading-7 whitespace-pre-wrap min-h-[200px]">
          {notice?.content}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="bg-gray-900 text-white hover:bg-gray-800">
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
