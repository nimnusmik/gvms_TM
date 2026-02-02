import { api } from "@/lib/axios";
import type { Notice } from "../types";

export const noticeApi = {
  // 목록 조회
  getNotices: async () => {
    const { data } = await api.get<Notice[]>('/notices/');
    return data;
  },
  // 공지 생성
  createNotice: async (data: { title: string; content: string; is_important: boolean }) => {
    await api.post('/notices/', data);
  },
  // 삭제
  deleteNotice: async (id: number) => {
    await api.delete(`/notices/${id}/`);
  }
};