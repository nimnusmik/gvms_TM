// src/features/agents/components/AgentEditDialog.tsx

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { agentApi } from "../api/agentApi";
import { TEAMS, AGENT_STATUS_OPTIONS } from "../types/";
import type { Agent } from "../types";

interface Props {
  agent: Agent | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AgentEditDialog({ agent, onClose, onSuccess }: Props) {
  // 상태 관리
  const [formData, setFormData] = useState<Partial<Agent>>({});
  const [isSubmitting, setIsSubmitting] = useState(false); // 중복 클릭 방지

  // 1. 초기 데이터 로드 (모달 열릴 때)
  useEffect(() => {
    if (agent) {
      setFormData({
        daily_cap: agent.daily_cap,
        status: agent.status,
        team: agent.team,
        assigned_phone: agent.assigned_phone, 
      });
    }
  }, [agent]);

  // 2. 정보 수정 핸들러
  const handleSave = async () => {
    if (!agent || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await agentApi.updateAgent(agent.agent_id, formData);
      toast.success("정보가 수정되었습니다.");
      onSuccess();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.account_id ? "이미 등록된 계정입니다." : "수정 실패";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. 👋 퇴사 처리 핸들러
  const handleResign = async () => {
    if (!agent) return;
    if (!confirm(`${agent.name} 님을 정말 퇴사 처리 하시겠습니까?\n로그인이 차단됩니다.`)) return;

    try {
      await agentApi.resignAgent(agent.agent_id);
      toast.info("퇴사 처리가 완료되었습니다.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("퇴사 처리 중 오류가 발생했습니다.");
    }
  };

  // 4. 🗑️ 완전 삭제 핸들러
  const handleDelete = async () => {
    if (!agent) return;
    if (!confirm(`[경고] 정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

    try {
      await agentApi.deleteAgent(agent.agent_id);
      toast.success("상담원이 영구 삭제되었습니다.");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "삭제 실패: 배정된 고객이 있을 수 있습니다.");
    }
  };

  return (
    <Dialog open={!!agent} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>상담원 정보 관리</DialogTitle>
          <DialogDescription>
            {agent?.name} ({agent?.email}) 님의 정보를 변경합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
           {/* 1. 팀 수정 */}
           <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium text-gray-600">소속 팀</label>
            <select
              className="col-span-3 h-10 w-full rounded-md border px-3 text-sm bg-white"
              value={formData.team || ""}
              onChange={(e) => setFormData({ ...formData, team: e.target.value || null })}
            >
              <option value="">(미배정)</option>
              {TEAMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* ✨ 2. 직통 번호 수정 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium text-gray-600">직통 번호</label>
            <Input
              placeholder="예: 010-1234-5678"
              className="col-span-3 bg-white"
              value={formData.assigned_phone || ""}
              onChange={(e) => setFormData({ ...formData, assigned_phone: e.target.value })}
            />
          </div>

          {/* 3. 배정량 수정 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium text-gray-600">일일 배정량</label>
            <Input
              type="number"
              className="col-span-3 bg-white"
              value={formData.daily_cap}
              onChange={(e) => setFormData({ ...formData, daily_cap: Number(e.target.value) })}
            />
          </div>

          {/* 4. 상태 수정 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium text-gray-600">현재 상태</label>
            <select
              className="col-span-3 h-10 w-full rounded-md border px-3 text-sm bg-white"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              {AGENT_STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="sm:justify-between sm:space-x-0">
          
          {/* 왼쪽: 위험한 작업들 */}
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDelete}
            >
              삭제
            </Button>
            <Button 
              type="button" 
              variant="secondary"
              onClick={handleResign}
              disabled={agent?.status === 'RESIGNED'}
            >
              {agent?.status === 'RESIGNED' ? '퇴사 완료' : '퇴사 처리'}
            </Button>
          </div>

          {/* 오른쪽: 저장/취소 */}
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "저장 중..." : "저장"}
            </Button>
          </div>
          
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}