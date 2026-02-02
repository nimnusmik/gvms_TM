// src/features/agents/components/AgentCreateDialog.tsx

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { agentApi } from "../api/agentApi";
import { TEAMS } from "../types/index";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // 성공 시 부모 목록 새로고침용
}

export function AgentCreateDialog({ isOpen, onClose, onSuccess }: Props) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [config, setConfig] = useState({ daily_cap: 50, team: 'BATTERY', assigned_phone: '' });

  
  // 모달 열릴 때 후보자 목록 로드
  useEffect(() => {
    if (isOpen) {
      setSelectedCandidate(null);
      setConfig({ daily_cap: 50, team: 'BATTERY', assigned_phone: '' });
      agentApi.getCandidates()
        .then(setCandidates)
        .catch(() => toast.error("후보자 목록 로딩 실패"));
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedCandidate) return;
    try {
      await agentApi.createAgent({
        account_id: selectedCandidate.id,
        daily_cap: config.daily_cap,
        team: config.team,
        assigned_phone: config.assigned_phone
      });
      toast.success("상담원이 등록되었습니다.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("등록 실패");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>상담원 신규 등록</DialogTitle>
          <DialogDescription>
            {selectedCandidate ? "초기 업무 환경을 설정해주세요." : "직원을 상담원으로 승격시킵니다."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 max-h-[400px] overflow-y-auto">
          {!selectedCandidate ? (
            /* [Step 1] 후보자 목록 */
            <div className="space-y-2">
              {candidates.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded text-muted-foreground text-sm">
                  등록 가능한 후보자가 없습니다.
                </div>
              ) : (
                candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-blue-50 cursor-pointer group"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <div>
                      <div className="font-bold text-sm">{candidate.name}</div>
                      <div className="text-xs text-muted-foreground">{candidate.email}</div>
                    </div>
                    <Button size="sm" variant="ghost"><Plus className="w-4 h-4" /></Button>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* [Step 2] 상세 설정 */
            <div className="space-y-4 px-1">
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                선택된 직원: <span className="font-bold text-blue-700">{selectedCandidate.name}</span>
              </div>

              {/* 팀 선택 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium text-gray-600">소속 팀</label>
                <select 
                  className="col-span-3 h-10 w-full rounded-md border px-3 text-sm bg-white"
                  value={config.team}
                  onChange={(e) => setConfig({ ...config, team: e.target.value })}
                >
                  {TEAMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* 배정량 입력 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium text-gray-600">배정량</label>
                <Input
                  type="number"
                  className="col-span-3 bg-white"
                  value={config.daily_cap}
                  onChange={(e) => setConfig({ ...config, daily_cap: Number(e.target.value) })}
                />
              </div>

              {/* ✨ [추가] 전화번호 입력 필드 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium text-gray-600">배정 받을 번호</label>
                <Input
                  placeholder="예: 010-1234-5678"
                  className="col-span-3 bg-white"
                  value={config.assigned_phone}
                  onChange={(e) => setConfig({ ...config, assigned_phone: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2">
          {selectedCandidate ? (
            <>
              <Button variant="outline" onClick={() => setSelectedCandidate(null)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> 뒤로
              </Button>
              <Button onClick={handleSubmit}>등록 완료</Button>
            </>
          ) : (
            <Button variant="ghost" onClick={onClose}>취소</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}