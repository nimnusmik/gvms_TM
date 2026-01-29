// src/features/agents/components/AgentTable.tsx

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserCog } from "lucide-react";
import { TEAMS } from "../types/"; // 상수 import
import type { Agent } from "../types";

interface AgentTableProps {
  agents: Agent[];
  isLoading: boolean;
  onEdit: (agent: Agent) => void;
}

export function AgentTable({ agents, isLoading, onEdit }: AgentTableProps) {
  // 팀 이름 찾기 헬퍼
  const getTeamLabel = (teamCode: string | null) => {
    return TEAMS.find(t => t.value === teamCode)?.label || teamCode;
  };

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">상태</TableHead>
            <TableHead>상담원 정보</TableHead>
            <TableHead>소속 팀</TableHead>
            <TableHead>사번</TableHead>
            <TableHead>일일 배정량</TableHead>
            <TableHead>권한(Role)</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                데이터 로딩 중...
              </TableCell>
            </TableRow>
          ) : agents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                등록된 상담원이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            agents.map((agent) => (
              <TableRow key={agent.agent_id}>
                {/* 1. 상태 */}
                <TableCell>
                  <Badge variant={agent.status === 'ONLINE' ? 'default' : 'secondary'} className="font-normal">
                    {agent.status}
                  </Badge>
                </TableCell>

                {/* 2. 상담원 정보 */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {agent.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{agent.name}</div>
                      <div className="text-xs text-gray-400">{agent.email}</div>
                    </div>
                  </div>
                </TableCell>

                {/* 3. 소속 팀 */}
                <TableCell>
                  {agent.team ? (
                    <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                      {getTeamLabel(agent.team)}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-xs">미배정</span>
                  )}
                </TableCell>

                {/* 4. 사번 */}
                <TableCell className="text-gray-500 text-sm font-mono">
                  {agent.code}
                </TableCell>

                {/* 5. 배정량 */}
                <TableCell className="font-medium">
                  {agent.daily_cap} <span className="text-gray-400 text-xs font-normal">건/일</span>
                </TableCell>

                {/* 6. 권한 */}
                <TableCell className="text-gray-500 text-xs uppercase">
                  {agent.role}
                </TableCell>

                {/* 7. 작업 버튼 */}
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(agent)}>
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}