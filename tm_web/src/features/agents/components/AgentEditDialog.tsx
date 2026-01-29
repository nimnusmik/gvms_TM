// src/features/agents/components/AgentEditDialog.tsx

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { agentApi } from "../api/agentApi";
import { TEAMS, AGENT_STATUS_OPTIONS } from "../types/"; // 상수 사용
import type { Agent } from "../types";

interface Props {
  agent: Agent | null;
  onClose: () => void;
  onSuccess: () => void; // 성공 시 부모 새로고침
}

export function AgentEditDialog({ agent, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState<Partial<Agent>>({});

  // 모달 열릴 때 데이터 세팅
  useEffect(() => {
    if (agent) {
      setFormData({
        daily_cap: agent.daily_cap,
        status: agent.status,
        role: agent.role,
        team: agent.team,
      });
    }
  }, [agent]);

  const handleSave = async () => {
    if (!agent) return;
    try {
      await agentApi.updateAgent(agent.agent_id, formData);
      toast.success("정보가 수정되었습니다.");
      onSuccess(); // ✅ 여기서 새로고침 트리거!
      onClose();
    } catch (error) {
      toast.error("수정 실패");
    }
  };

  return (
    <Dialog open={!!agent} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>상담원 정보 수정</DialogTitle>
          <DialogDescription>{agent?.name} 님의 정보를 변경합니다.</DialogDescription>
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

          {/* 2. 배정량 수정 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-medium text-gray-600">일일 배정량</label>
            <Input
              type="number"
              className="col-span-3 bg-white"
              value={formData.daily_cap}
              onChange={(e) => setFormData({ ...formData, daily_cap: Number(e.target.value) })}
            />
          </div>

          {/* 3. 상태 수정 */}
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}