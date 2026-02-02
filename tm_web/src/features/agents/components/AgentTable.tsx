import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TeamBadge } from "@/components/common/TeamBadge";
import { formatPhoneNumber } from "@/lib/formatter"; 

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
            <TableHead>배정 번호</TableHead>
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
              {/* 👇 헤더 개수가 8개라서 8로 수정 */}
              <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                데이터 로딩 중...
              </TableCell>
            </TableRow>
          ) : agents.length === 0 ? (
            <TableRow>
              {/* 👇 여기도 8로 수정 */}
              <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                등록된 상담원이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            agents.map((agent) => (
              <TableRow key={agent.agent_id || agent.agent_id}> {/* id가 없을 경우 대비 */}
                {/* 1. 상태 */}
                <TableCell>
                  <StatusBadge status={agent.status} />
                </TableCell>

                {/* 2. 상담원 정보 */}
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

                {/* ✨ 3. [수정됨] 배정 번호 (포맷팅 적용) */}
                <TableCell>
                  {agent.assigned_phone ? (
                    <span className="text-gray-900 font-mono text-sm">
                      {formatPhoneNumber(agent.assigned_phone)}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">번호 미배정</span>
                  )}
                </TableCell>

                {/* 4. 소속 팀 */}
                <TableCell>
                  <TeamBadge team={agent.team} />
                </TableCell>

                {/* 5. 사번 */}
                <TableCell className="text-gray-500 text-sm font-mono">
                  {agent.code || "-"}
                </TableCell>

                {/* 6. 배정량 */}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className={`font-bold ${
                      (agent.assigned_count || 0) >= agent.daily_cap 
                        ? "text-red-600" 
                        : "text-blue-600"
                    }`}>
                      {agent.assigned_count || 0}
                    </span>
                    
                    <span className="text-gray-300">/</span>
                    
                    <span className="text-gray-600">
                      {agent.daily_cap} 건
                    </span>
                  </div>
                </TableCell>

                {/* 7. 권한 */}
                <TableCell className="text-gray-500 text-xs uppercase">
                  {agent.role || "USER"}
                </TableCell>

                {/* 8. 작업 버튼 */}
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