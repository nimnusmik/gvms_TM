import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";
import { noticeApi } from "../api/noticeApi";

interface NoticeCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const initialForm = { title: "", content: "", is_important: false };

export function NoticeCreateDialog({ isOpen, onClose, onSuccess }: NoticeCreateDialogProps) {
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(initialForm);
  }, [isOpen]);

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.warning("제목을 입력해주세요.");
      return;
    }

    try {
      await noticeApi.createNotice(formData);
      toast.success("공지사항이 등록되었습니다.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("등록 실패");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" /> 새 공지사항 작성
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div className="flex items-center gap-2 bg-yellow-50 p-3 rounded-md border border-yellow-100">
            <input
              type="checkbox"
              id="imp"
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              checked={formData.is_important}
              onChange={(e) => setFormData({ ...formData, is_important: e.target.checked })}
            />
            <label htmlFor="imp" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
              이 공지를 상단에 고정합니다 (중요 공지)
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">제목</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="공지 제목을 입력하세요"
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">내용</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="공지 내용을 상세히 작성해주세요"
              className="h-48 bg-white resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
            등록하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
