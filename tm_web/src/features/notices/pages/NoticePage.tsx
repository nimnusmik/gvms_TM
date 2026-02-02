import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea"; // ui 컴포넌트에 없다면 input으로 대체 가능
import { noticeApi } from "../api/noticeApi";
import type { Notice } from "../types";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function NoticePage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // 입력 폼 상태
  const [formData, setFormData] = useState({ title: "", content: "", is_important: false });

  const fetchNotices = async () => {
    try {
      const data = await noticeApi.getNotices();
      setNotices(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreate = async () => {
    if(!formData.title) return;
    try {
      await noticeApi.createNotice(formData);
      toast.success("공지사항이 등록되었습니다.");
      setIsOpen(false);
      setFormData({ title: "", content: "", is_important: false });
      fetchNotices();
    } catch (e) {
      toast.error("등록 실패");
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("삭제하시겠습니까?")) return;
    await noticeApi.deleteNotice(id);
    fetchNotices();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">공지사항 게시판</h1>
          <p className="text-sm text-gray-500">시스템 전체 공지사항을 관리합니다.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> 공지 작성
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm divide-y">
        {notices.length === 0 ? (
          <div className="p-10 text-center text-gray-500">등록된 공지사항이 없습니다.</div>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className="p-4 flex items-start justify-between hover:bg-gray-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {notice.is_important && <Badge variant="destructive" className="text-xs">필독</Badge>}
                  <span className="font-medium text-gray-900">{notice.title}</span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-2">{notice.content}</p>
                <div className="text-xs text-gray-400">
                  {new Date(notice.created_at).toLocaleDateString()} · {notice.author_name}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(notice.id)}>
                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* 작성 모달 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 공지사항 작성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">제목</label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                placeholder="공지 제목 입력"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">내용</label>
              <Textarea 
                value={formData.content} 
                onChange={(e) => setFormData({...formData, content: e.target.value})} 
                placeholder="공지 내용 입력"
                className="h-32"
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="imp" 
                checked={formData.is_important}
                onChange={(e) => setFormData({...formData, is_important: e.target.checked})}
              />
              <label htmlFor="imp" className="text-sm cursor-pointer">중요 공지 (상단 고정)</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>취소</Button>
            <Button onClick={handleCreate}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}