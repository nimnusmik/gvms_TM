// src/features/notices/pages/NoticePage.tsx

import { useState } from "react";
import { toast } from "sonner";
import { noticeApi } from "../api/noticeApi";
import type { Notice } from "../types";
import { NoticeCreateDialog } from "../components/NoticeCreateDialog";
import { NoticeDetailDialog } from "../components/NoticeDetailDialog";
import { NoticeTable } from "../components/NoticeTable";
import { NoticeToolbar } from "../components/NoticeToolbar";
import { useNoticeList } from "../hooks/useNoticeList";

export default function NoticePage() {
  const { filteredNotices, searchTerm, setSearchTerm, isLoading, refresh } = useNoticeList();

  // 모달 상태 관리
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // 삭제 핸들러
  const handleDelete = async (id: number) => {
    if (!confirm("정말 이 공지사항을 삭제하시겠습니까?")) return;
    try {
      await noticeApi.deleteNotice(id);
      toast.success("삭제되었습니다.");
      // 만약 보고 있던 글을 삭제했다면 모달 닫기
      if (selectedNotice?.id === id) setSelectedNotice(null);
      refresh();
    } catch(e) {
      toast.error("삭제 실패");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 상단 헤더 & 검색바 */}
      <NoticeToolbar
        totalCount={filteredNotices.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      {/* 게시판 테이블 */}
      <NoticeTable
        notices={filteredNotices}
        isLoading={isLoading}
        onRowClick={setSelectedNotice}
        onDelete={handleDelete}
      />

      <NoticeDetailDialog notice={selectedNotice} onClose={() => setSelectedNotice(null)} />

      <NoticeCreateDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={refresh}
      />
    </div>
  );
}
