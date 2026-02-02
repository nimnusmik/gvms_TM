import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { noticeApi } from "../api/noticeApi";
import type { Notice } from "../types";

export function useNoticeList() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await noticeApi.getNotices();
      setNotices(data);
    } catch (error) {
      console.error(error);
      toast.error("공지사항을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFilteredNotices(notices);
      return;
    }

    const filtered = notices.filter((notice) =>
      notice.title.toLowerCase().includes(term) ||
      notice.author_name?.toLowerCase().includes(term)
    );

    setFilteredNotices(filtered);
  }, [notices, searchTerm]);

  return {
    notices,
    filteredNotices,
    searchTerm,
    setSearchTerm,
    isLoading,
    refresh: fetchNotices,
  };
}
