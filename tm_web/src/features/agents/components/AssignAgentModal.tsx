import { useState, useEffect } from 'react';
import { agentApi } from '@/features/agents/api/agentApi';
import type { Agent } from '@/features/agents/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
// 👇 1. formatter import 추가
import { formatPhoneNumber } from "@/lib/formatter";

interface AssignAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (agentId: string) => Promise<void>;
  selectedCount: number;
}

export default function AssignAgentModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  selectedCount 
}: AssignAgentModalProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsFetching(true);
      agentApi.getAgents()
        .then((data) => {
            setAgents(data);
        })
        .catch((err) => {
            console.error("🚨 상담원 목록 로드 실패:", err);
            alert("상담원 목록을 불러오지 못했습니다.");
        })
        .finally(() => setIsFetching(false));
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedAgentId) return alert("상담원을 선택해주세요.");
    
    setIsLoading(true);
    try {
      await onConfirm(selectedAgentId);
      onClose();
      setSelectedAgentId("");
    } catch (error) {
      // 에러 처리
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] bg-white">
        <DialogHeader>
          <DialogTitle>상담원 배정</DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <p className="text-sm text-gray-600">
            선택된 <span className="font-bold text-blue-600 text-lg">{selectedCount}명</span>의 고객을<br/>
            누구에게 배정하시겠습니까?
          </p>

          <select 
            className="w-full p-3 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            disabled={isFetching}
          >
            <option value="" disabled>
              {isFetching ? "상담원 목록 로딩 중..." : "✓ 상담원 선택..."}
            </option>
            
            {agents.map((agent: any) => (
              <option key={agent.id || agent.agent_id} value={agent.id || agent.agent_id}>
                {agent.name || agent.user?.name || "이름 없음"}
                
                {agent.assigned_phone ? ` / ${formatPhoneNumber(agent.assigned_phone)}` : ""}
                
                {/* 상태 표시 */}
                {agent.status ? ` (${agent.status})` : ""}
              </option>
            ))}
          </select>
          
          {!isFetching && agents.length === 0 && (
            <p className="text-xs text-red-500 mt-1">
              * 배정 가능한 상담원이 없습니다.
            </p>
          )}
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              취소
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || !selectedAgentId}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? '배정 중...' : '확인'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}