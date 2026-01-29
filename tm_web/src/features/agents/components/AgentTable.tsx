import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

// ✅ 공통 컴포넌트 활용
import { StatusBadge } from "@/components/common/StatusBadge";
import { TeamBadge } from "@/components/common/TeamBadge";

import type { Agent } from "../types";

interface AgentTableProps {
  agents: Agent[];
  isLoading: boolean;
  onEdit: (agent: Agent) => void;
}

export function AgentTable({ agents, isLoading, onEdit }: AgentTableProps) {
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
                {/* 1. 상태 (공통 컴포넌트 사용) */}
                <TableCell>
                  <StatusBadge status={agent.status} />
                </TableCell>

                {/* 2. 상담원 정보 (공통 컴포넌트 사용) */}
                <TableCell>
                <div className="flex flex-col justify-center">
                  <div className="font-medium text-sm text-gray-900">
                      {agent.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                      {agent.email}
                  </div>
                </div>
                </TableCell>

                {/* 3. 소속 팀 (공통 컴포넌트 사용 - 미배정 로직 내장됨) */}
                <TableCell>
                  <TeamBadge team={agent.team} />
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