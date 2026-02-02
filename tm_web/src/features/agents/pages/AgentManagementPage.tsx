// src/features/agents/pages/AgentManagementPage.tsx

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, RefreshCw } from "lucide-react";
import { agentApi } from "../api/agentApi";
import type { Agent } from "../types";

// 분리한 컴포넌트들 불러오기
import { AgentTable } from "../components/AgentTable";
import { AgentCreateDialog } from "../components/AgentCreateDialog";
import { AgentEditDialog } from "../components/AgentEditDialog";

export default function AgentManagementPage() {
  // 1. 데이터 상태
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 2. UI 상태 (모달)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // 3. 필터 상태 (필요 시 확장)
  const [searchTerm, setSearchTerm] = useState("");

  // 데이터 불러오기 함수
  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await agentApi.getAgents();
      setAgents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로딩
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // 검색 필터링 (클라이언트 사이드 예시)
  const filteredAgents = agents.filter(agent => 
    agent.name.includes(searchTerm) || 
    agent.email?.includes(searchTerm) ||
    agent.code?.includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6">
      {/* --- 상단 헤더 & 툴바 --- */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">상담원 관리</h1>
            <p className="text-sm text-muted-foreground mt-1">
              현재 활동 중인 상담원 <span className="font-bold text-blue-600">{agents.length}명</span>을 관리합니다.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <UserPlus className="w-4 h-4 mr-2" /> 상담원 신규 등록
          </Button>
        </div>

        <div className="flex items-center gap-2 bg-white p-3 rounded-lg border shadow-sm">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="이름, 사번, 이메일 검색..." 
              className="pl-9 bg-gray-50 border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-1"></div>
          <Button variant="outline" size="sm" onClick={fetchAgents}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 목록 새로고침
          </Button>
        </div>
      </div>

      {/* --- 메인 테이블 (분리됨!) --- */}
      <AgentTable 
        agents={filteredAgents} 
        isLoading={isLoading} 
        onEdit={(agent) => setEditingAgent(agent)} 
      />

      {/* --- 모달들 (분리됨!) --- */}
      {/* 1. 생성 모달 */}
      <AgentCreateDialog 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchAgents} // 성공 시 목록 새로고침
      />

      {/* 2. 수정 모달 */}
      <AgentEditDialog 
        agent={editingAgent} 
        onClose={() => setEditingAgent(null)}
        onSuccess={fetchAgents} // 성공 시 목록 새로고침
      />
    </div>
  );
}