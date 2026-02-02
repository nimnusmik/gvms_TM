// src/features/dashboard/components/DashboardNoticeCard.tsx

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom"; // 라우터 링크 사용
import { ChevronRight, Megaphone } from "lucide-react";

// 공지사항 API와 타입 import (경로가 다르면 수정해주세요)
import { noticeApi } from "@/features/notices/api/noticeApi";
import type { Notice } from "@/features/notices/types";

export function DashboardNoticeCard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNotices = async () => {
      try {
        const data = await noticeApi.getNotices();
        // 최신순 5개만 자르기
        setNotices(data.slice(0, 5));
      } catch (error) {
        console.error("공지사항 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadNotices();
  }, []);

  return (
    // Grid 시스템에서 7칸 중 3칸을 차지하도록 설정 (CallTrendCard가 4칸 차지 예상)
    <Card className="col-span-full lg:col-span-3 h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-base font-bold text-gray-900">
            시스템 공지사항
          </CardTitle>
        </div>
        {/* 전체보기 링크 */}
        <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-500" asChild>
          <Link to="/dashboard/notices">
            전체보기 <ChevronRight className="ml-1 w-3 h-3" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">
            로딩 중...
          </div>
        ) : notices.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center text-gray-400 gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm">등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div key={notice.id} className="group flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                {/* 상태 표시 점 (중요: 빨간 펄스 / 일반: 파란 점) */}
                <div className="mt-1.5 shrink-0">
                  {notice.is_important ? (
                    <div className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </div>
                  ) : (
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500/20 ring-1 ring-blue-500" />
                  )}
                </div>

                {/* 제목 및 날짜 */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                  <Link 
                      to="/dashboard/notices"
                      className="text-sm font-medium text-gray-700 hover:text-blue-600 truncate transition-colors"
                    >
                      {notice.title}
                    </Link>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    {new Date(notice.created_at).toLocaleDateString()}
                    <span className="text-gray-300">|</span>
                    {notice.author_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}