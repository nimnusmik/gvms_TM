import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/common/Pagination';
import { settlementApi, type SettlementFilters } from '../api/settlementApi';
import type { SettlementRow, SettlementSummaryResponse } from '../types';
import { SettlementKpiCard } from '../components/SettlementKpiCard';
import { SettlementTrendChart } from '../components/SettlementTrendChart';
import { agentApi } from '@/features/agents/api/agentApi';
import type { Agent } from '@/features/agents/types';

const formatNumber = (value: number) => new Intl.NumberFormat('ko-KR').format(value);

const statusOptions = [
  { value: 'PENDING', label: '지급 대기' },
  { value: 'REVIEW', label: '검토 필요' },
  { value: 'PAID', label: '지급 완료' },
];

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function SettlementPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const today = new Date();
  const [startDate, setStartDate] = useState(formatDateInput(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)));
  const [endDate, setEndDate] = useState(formatDateInput(today));
  const view: 'day' | 'week' = 'day';
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  const [appliedFilters, setAppliedFilters] = useState<SettlementFilters>({
    start_date: formatDateInput(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)),
    end_date: formatDateInput(today),
    view,
    agent_ids: [],
  });

  const [summary, setSummary] = useState<SettlementSummaryResponse | null>(null);
  const [rows, setRows] = useState<SettlementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [rowEdits, setRowEdits] = useState<Record<number, { status: string; final_amount: string }>>({});
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isAgentPinned, setIsAgentPinned] = useState(true);

  useEffect(() => {
    agentApi.getAgents()
      .then((data) => setAgents(data))
      .catch(() => toast.error('상담원 목록 로딩 실패'));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [summaryResult, rowsResult] = await Promise.all([
          settlementApi.getSummary(appliedFilters),
          settlementApi.getRows({ ...appliedFilters, page }),
        ]);
        setSummary(summaryResult);
        setRows(rowsResult.results || []);
        setTotalCount(rowsResult.count || 0);
      } catch (error) {
        console.error('정산 데이터 로딩 실패:', error);
        toast.error('정산 데이터를 불러오지 못했습니다.');
        setRows([]);
        setSummary(null);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appliedFilters, page]);

  useEffect(() => {
    const edits: Record<number, { status: string; final_amount: string }> = {};
    rows.forEach((row) => {
      edits[row.id] = {
        status: row.status,
        final_amount: Number.isFinite(row.final_amount) ? String(row.final_amount) : '',
      };
    });
    setRowEdits(edits);
  }, [rows]);

  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => a.name.localeCompare(b.name));
  }, [agents]);

  const selectedAgentNames = useMemo(() => {
    const map = new Map(sortedAgents.map((agent) => [agent.agent_id, agent.name]));
    return selectedAgents.map((id) => map.get(id)).filter(Boolean) as string[];
  }, [selectedAgents, sortedAgents]);

  const totalPages = Math.max(Math.ceil(totalCount / 50), 1);

  const handleApply = () => {
    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T00:00:00`);
      if (start > end) {
        toast.error('시작 기간은 종료 기간보다 앞서야 합니다.');
        return;
      }
    }
    setAppliedFilters({
      start_date: startDate,
      end_date: endDate,
      view,
      agent_ids: selectedAgents,
    });
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const response = await settlementApi.exportExcel(appliedFilters);
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `settlements_${appliedFilters.start_date}_${appliedFilters.end_date}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('엑셀 다운로드 완료');
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      toast.error('엑셀 다운로드 실패');
    }
  };

  const handleToggleAgent = (agentId: string) => {
    setSelectedAgents((prev) => {
      if (prev.includes(agentId)) {
        return prev.filter((id) => id !== agentId);
      }
      return [...prev, agentId];
    });
  };

  const handleClearAgents = () => {
    setSelectedAgents([]);
  };

  const handleRowChange = (id: number, field: 'status' | 'final_amount', value: string) => {
    setRowEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSaveRow = async (row: SettlementRow) => {
    const edit = rowEdits[row.id];
    if (!edit) return;

    const payload: { status: string; final_amount: number | null } = {
      status: edit.status,
      final_amount: null,
    };

    if (edit.final_amount !== '') {
      const parsed = Number(edit.final_amount);
      if (Number.isNaN(parsed) || parsed < 0) {
        toast.error('최종 정산액을 확인해주세요.');
        return;
      }
      payload.final_amount = parsed;
    }

    setSavingIds((prev) => new Set([...prev, row.id]));
    try {
      const updated = await settlementApi.updateRow(row.id, payload);
      setRows((prev) => prev.map((item) => (item.id === row.id ? updated : item)));
      toast.success('정산 정보가 저장되었습니다.');
    } catch (error) {
      console.error('정산 정보 저장 실패:', error);
      toast.error('정산 정보 저장 실패');
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
    }
  };

  const viewLabel = `${appliedFilters.start_date} ~ ${appliedFilters.end_date} 일자 기준`;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeaderCard
        title="정산 관리"
        description="월별 정산 데이터를 집계하고 상태를 관리합니다."
        variant="dark"
        right={
          <Button onClick={handleExport} disabled={loading}>
            엑셀 다운로드
          </Button>
        }
      />

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-7">
            <label className="text-sm text-gray-600">기간 선택</label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">시작 기간</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full min-w-[200px] rounded-lg border border-gray-200 px-3 py-2 text-sm h-10"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">종료 기간</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full min-w-[200px] rounded-lg border border-gray-200 px-3 py-2 text-sm h-10"
                />
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <label className="text-sm text-gray-600">상담원 선택</label>
            <div className="relative mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAgentOpen((prev) => {
                    const next = !prev;
                    if (next) setIsAgentPinned(true);
                    return next;
                  });
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm bg-white"
              >
                {selectedAgentNames.length === 0 ? '상담원을 선택하세요' : null}
                {selectedAgentNames.length > 0 ? (
                  <span className="inline-flex flex-wrap gap-2">
                    {selectedAgentNames.map((name) => (
                      <span
                        key={name}
                        className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                      >
                        {name}
                      </span>
                    ))}
                  </span>
                ) : null}
              </button>
              {(isAgentOpen || (isAgentPinned && selectedAgents.length > 0)) ? (
                <div className="absolute z-10 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2 text-xs text-gray-500">
                    <span>상담원 목록</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleClearAgents}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        전체 해제
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAgentOpen(false);
                          setIsAgentPinned(false);
                        }}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        선택 완료
                      </button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-auto py-2">
                    {sortedAgents.map((agent) => {
                      const checked = selectedAgents.includes(agent.agent_id);
                      return (
                        <label
                          key={agent.agent_id}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleAgent(agent.agent_id)}
                          />
                          <span>{agent.name}</span>
                        </label>
                      );
                    })}
                    {sortedAgents.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-gray-400">
                        상담원이 없습니다.
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="lg:col-span-2 flex lg:justify-end">
            <Button onClick={handleApply} className="w-full lg:w-28 h-10 bg-slate-900 text-white hover:bg-slate-800">조회</Button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <SettlementKpiCard
          title="총 정산 예정액"
          value={`${formatNumber(summary?.cards.total_amount ?? 0)}원`}
          accent="blue"
        />
        <SettlementKpiCard
          title="평균 단가"
          value={`${formatNumber(summary?.cards.avg_unit_price ?? 0)}원`}
          sub="정산액/정산건수"
          accent="slate"
        />
        <SettlementKpiCard
          title="정산 대상 건수"
          value={`${formatNumber(summary?.cards.billable_count ?? 0)}건`}
          accent="amber"
        />
        <SettlementKpiCard
          title="지급 대기 합계"
          value={`${formatNumber(summary?.cards.pending_amount ?? 0)}원`}
          accent="green"
        />
      </div>

      <div className="mt-8 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-gray-800">사원별 정산 상세 내역</h3>
            <p className="text-sm text-gray-400 mt-1">상태/비고/최종 정산액을 수정할 수 있습니다.</p>
          </div>
          <div className="text-xs text-gray-400">
            정산 기준: 동의 2,000원 · 거절 700원 · 결번 0원 · 부재 0원 (is_billable=TRUE)
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-center">사원명</th>
                <th className="py-3 px-4 text-center text-emerald-600">동의</th>
                <th className="py-3 px-4 text-center text-rose-500">거절</th>
                <th className="py-3 px-4 text-center text-slate-500">결번</th>
                <th className="py-3 px-4 text-center text-amber-500">부재</th>
                <th className="py-3 px-4 text-center">정산건수</th>
                <th className="py-3 px-4 text-center">산정금액</th>
                <th className="py-3 px-4 text-center">최종정산액</th>
                <th className="py-3 px-4 text-center">상태</th>
                <th className="py-3 px-4 text-center">저장</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">데이터를 불러오는 중...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">표시할 정산 내역이 없습니다.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-gray-800">{row.agent_name}</td>
                    <td className="py-3 px-4 text-center text-emerald-700 font-semibold">{row.success_count}</td>
                    <td className="py-3 px-4 text-center text-rose-600 font-semibold">{row.reject_count}</td>
                    <td className="py-3 px-4 text-center text-slate-500 font-semibold">{row.invalid_count}</td>
                    <td className="py-3 px-4 text-center text-amber-600 font-semibold">{row.absence_count}</td>
                    <td className="py-3 px-4 text-center">{row.billable_count}</td>
                    <td className="py-3 px-4 text-center font-semibold">{formatNumber(row.calculated_amount)}원</td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        value={rowEdits[row.id]?.final_amount ?? ''}
                        onChange={(e) => handleRowChange(row.id, 'final_amount', e.target.value)}
                        className="w-28 rounded-md border border-gray-200 px-2 py-1 text-center"
                        min={0}
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={rowEdits[row.id]?.status ?? row.status}
                        onChange={(e) => {
                          handleRowChange(row.id, 'status', e.target.value);
                        }}
                        className="rounded-md border border-gray-200 px-2 py-1 text-sm"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        size="sm"
                        onClick={() => handleSaveRow(row)}
                        disabled={savingIds.has(row.id)}
                      >
                        {savingIds.has(row.id) ? '저장 중' : '저장'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12">
          <SettlementTrendChart data={summary?.chart ?? []} viewLabel={viewLabel} />
        </div>
      </div>
    </div>
  );
}
