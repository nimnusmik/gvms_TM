import { useEffect, useMemo, useState } from 'react';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { Button } from '@/components/ui/button';
import { assignmentHistoryApi } from '../api/assignmentHistoryApi';
import type { AssignmentHistorySummaryItem } from '../types';
import { agentApi } from '@/features/agents/api/agentApi';
import type { Agent } from '@/features/agents/types';

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildDateRange = (start: string, end: string) => {
  if (!start || !end) return [] as string[];
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return [];
  }
  if (startDate > endDate) return [];

  const dates: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    dates.push(formatDateInput(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

export default function AssignmentHistoryPage() {
  const today = new Date();
  const defaultEnd = formatDateInput(today);
  const defaultStart = formatDateInput(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000));

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [items, setItems] = useState<AssignmentHistorySummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    agentApi.getAgents().then(setAgents).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!startDate || !endDate) return;
      setLoading(true);
      try {
        const data = await assignmentHistoryApi.getSummary({
          start_date: startDate,
          end_date: endDate,
          agent_id: selectedAgent || undefined,
        });
        setItems(data.items || []);
      } catch (error) {
        console.error('배정 이력 조회 실패:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [startDate, endDate, selectedAgent]);

  const dateRange = useMemo(() => buildDateRange(startDate, endDate), [startDate, endDate]);

  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (aTime !== bTime) return aTime - bTime;
      return a.name.localeCompare(b.name);
    });
  }, [agents]);

  const filteredAgents = useMemo(() => {
    if (!selectedAgent) return sortedAgents;
    return sortedAgents.filter((agent) => agent.agent_id === selectedAgent);
  }, [sortedAgents, selectedAgent]);

  const countsMap = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      map.set(`${item.agent_id}|${item.date}`, item.assigned_count);
    });
    return map;
  }, [items]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const response = await assignmentHistoryApi.exportExcel({
        start_date: startDate,
        end_date: endDate,
        agent_id: selectedAgent || undefined,
      });
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `assignment_history_${startDate}_${endDate}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeaderCard
        title="배정 이력 (스냅샷)"
        description="담당 변경 시 과거 기록도 갱신될 수 있습니다."
        variant="dark"
        right={
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? '다운로드 중...' : '엑셀 다운로드'}
          </Button>
        }
      />

      <div className="mt-6 bg-white rounded-xl shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-sm text-gray-600">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">상담원</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="">전체 상담원</option>
              {sortedAgents.map((agent) => (
                <option key={agent.agent_id} value={agent.agent_id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 bg-gray-50 text-left px-4 py-3 border-b">상담원</th>
                {dateRange.map((date) => (
                  <th key={date} className="px-4 py-3 text-center border-b whitespace-nowrap">
                    {date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={Math.max(dateRange.length + 1, 1)} className="text-center py-10 text-gray-400">
                    데이터를 불러오는 중...
                  </td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={Math.max(dateRange.length + 1, 1)} className="text-center py-10 text-gray-400">
                    표시할 상담원이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr key={agent.agent_id} className="border-b last:border-b-0">
                    <td className="sticky left-0 bg-white px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                      {agent.name}
                    </td>
                    {dateRange.map((date) => {
                      const count = countsMap.get(`${agent.agent_id}|${date}`) ?? 0;
                      return (
                        <td key={`${agent.agent_id}-${date}`} className="px-4 py-3 text-center">
                          {count}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
