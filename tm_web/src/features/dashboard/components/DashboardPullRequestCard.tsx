import { useEffect, useMemo, useState } from "react";
import { BellRing, CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { pullRequestApi } from "../api/pullRequestApi";
import type { PullRequestItem } from "../types";

const isToday = (value: string) => {
  const target = new Date(value);
  const now = new Date();
  return (
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate()
  );
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export function DashboardPullRequestCard() {
  const [requests, setRequests] = useState<PullRequestItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await pullRequestApi.list({ status: "PENDING", page: 1 });
      setRequests(data.results ?? []);
      setTotalCount(data.count ?? data.results?.length ?? 0);
    } catch (error) {
      setErrorMessage("요청 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (dialogOpen) {
      fetchRequests();
    }
  }, [dialogOpen]);

  const latestRequest = requests[0];
  const todayCount = useMemo(() => requests.filter((item) => isToday(item.created_at)).length, [requests]);

  const handleApprove = async (id: number) => {
    setActionId(id);
    try {
      await pullRequestApi.approve(id);
      await fetchRequests();
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionId(id);
    try {
      await pullRequestApi.reject(id);
      await fetchRequests();
    } finally {
      setActionId(null);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <Card className="border border-slate-200/70 bg-white/90 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                DB 신청 승인 알림
              </CardTitle>
              <div className="text-xs text-slate-500">
                상담원 신청 현황을 바로 확인하고 승인하세요.
              </div>
            </div>
          </div>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9">
              처리하기
            </Button>
          </DialogTrigger>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              승인 대기 목록을 불러오는 중...
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col gap-2 text-sm text-rose-600">
              {errorMessage}
              <div className="text-xs text-rose-400">
                잠시 후 다시 시도해주세요.
              </div>
            </div>
          ) : totalCount === 0 ? (
            <div className="flex flex-col gap-2 text-sm text-slate-500">
              현재 승인 대기 요청이 없습니다.
              <div className="text-xs text-slate-400">
                신규 신청이 들어오면 이곳에 표시됩니다.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">
                  {latestRequest?.agent_name ?? "상담원"}
                </span>{" "}
                사원이{" "}
                <span className="font-semibold text-indigo-600">
                  {latestRequest?.requested_count ?? 0}건
                </span>{" "}
                땡겨오기를 신청했습니다.
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100">
                  승인 대기 {totalCount}건
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-500">
                  오늘 신청 {todayCount}건
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>DB 신청 승인함</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <div className="text-slate-600">
              승인 대기{" "}
              <span className="font-semibold text-slate-900">{totalCount}건</span>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchRequests} disabled={isLoading}>
              새로고침
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              목록을 불러오는 중...
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              현재 승인 대기 요청이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {item.agent_name ?? "상담원"} · {item.requested_count}건 신청
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        요청 시간: {formatDateTime(item.created_at)}
                      </div>
                      {item.request_note && (
                        <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          사유: {item.request_note}
                        </div>
                      )}
                    </div>
                    <Badge className="bg-amber-50 text-amber-600 border border-amber-100">
                      승인 대기
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() => handleApprove(item.id)}
                      disabled={actionId === item.id}
                    >
                      {actionId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                      )}
                      승인
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => handleReject(item.id)}
                      disabled={actionId === item.id}
                    >
                      {actionId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-1 h-4 w-4 text-rose-500" />
                      )}
                      거절
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
