import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { callLogApi } from "../api/callLogApi";
import type { CallLog } from "../types";

interface CallLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId?: number;
  customerName?: string | null;
}

const formatDuration = (seconds?: number | null) => {
  if (!seconds || seconds < 0) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

export function CallLogDialog({ open, onOpenChange, assignmentId, customerName }: CallLogDialogProps) {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [audioLoadingId, setAudioLoadingId] = useState<number | null>(null);
  const [activeAudio, setActiveAudio] = useState<{ id: number; url: string } | null>(null);
  const title = useMemo(() => (customerName ? `${customerName} 통화기록` : "통화기록"), [customerName]);

  useEffect(() => {
    if (!open || !assignmentId) return;
    let isMounted = true;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await callLogApi.listByAssignment(assignmentId);
        const results = Array.isArray(data) ? data : data.results ?? [];
        if (isMounted) {
          setLogs(results);
          setActiveAudio(null);
        }
      } catch (error) {
        console.error("통화기록 조회 실패:", error);
        if (isMounted) {
          setLogs([]);
          setActiveAudio(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLogs();
    return () => {
      isMounted = false;
    };
  }, [open, assignmentId]);

  const handlePlay = async (log: CallLog) => {
    if (!log.id) return;
    setAudioLoadingId(log.id);
    try {
      const data = await callLogApi.getRecordingUrl(log.id);
      setActiveAudio({ id: log.id, url: data.download_url });
    } catch (error) {
      console.error("녹취 URL 발급 실패:", error);
    } finally {
      setAudioLoadingId(null);
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] bg-white max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="text-sm text-gray-500">통화기록을 불러오는 중입니다...</div>
          ) : logs.length === 0 ? (
            <div className="text-sm text-gray-500">통화기록이 없습니다.</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">통화일시</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">결과</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">통화시간</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">메모</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">녹취상태</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">녹취</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => {
                    const uploaded = log.recording_status === "UPLOADED";
                    return (
                      <tr key={log.id}>
                        <td className="px-4 py-2 text-gray-700">{formatDateTime(log.call_start)}</td>
                        <td className="px-4 py-2 text-gray-700">{log.result || "-"}</td>
                        <td className="px-4 py-2 text-gray-700">{formatDuration(log.duration)}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{log.memo || <span className="text-gray-400">-</span>}</td>
                        <td className="px-4 py-2 text-gray-700">{log.recording_status || "-"}</td>
                        <td className="px-4 py-2">
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!uploaded || audioLoadingId === log.id}
                              onClick={() => handlePlay(log)}
                            >
                              {audioLoadingId === log.id ? "로딩중..." : uploaded ? "재생" : "없음"}
                            </Button>
                            {activeAudio?.id === log.id ? (
                              <audio controls className="w-full" src={activeAudio.url} />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
