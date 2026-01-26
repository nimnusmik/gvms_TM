import { useEffect, useState } from "react";
import { agentApi } from "../api/agentApi";
import { Agent, AgentRole } from "../types";
import { useAuthStore } from "@/features/auth/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, MoreHorizontal, UserPlus } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AgentManagementPage() {
  const { user } = useAuthStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 데이터 로딩
  const fetchAgents = async () => {
    try {
      const data = await agentApi.getAgents();
      setAgents(data);
    } catch (error) {
      console.error("상담원 목록 로딩 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const data = await agentApi.getCandidates();
      setCandidates(data);
    } catch (error) {
      console.error("후보자 로딩 실패:", error);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleOpenModal = () => {
    fetchCandidates();
    setIsModalOpen(true);
  };

  const handleCreate = async (accountId: number) => {
    if (!confirm("해당 직원을 상담원으로 등록하시겠습니까?")) return;
    try {
      // API 요청 시 정확한 필드명 전송
      await agentApi.createAgent({
        account_id: accountId,
        name: candidates.find((c) => c.id === accountId)?.email.split("@")[0] || "신규상담원",
        daily_cap: 50,
        role: AgentRole.AGENT,
      });
      alert("등록되었습니다.");
      setIsModalOpen(false);
      fetchAgents();
    } catch (error) {
      alert("등록 실패");
    }
  };

  // 검색 필터링
  const filteredAgents = agents.filter(agent => 
    agent.name.includes(searchTerm) || 
    agent.code?.includes(searchTerm) ||
    agent.account_email?.includes(searchTerm)
  );

  // 상태에 따른 배지 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ONLINE": return "bg-green-500 hover:bg-green-600";
      case "BUSY": return "bg-red-500 hover:bg-red-600";
      case "BREAK": return "bg-yellow-500 hover:bg-yellow-600";
      default: return "bg-slate-400 hover:bg-slate-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. 헤더 및 액션바 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">상담원 관리</h2>
          <p className="text-muted-foreground mt-1">
            총 {agents.length}명의 상담원이 등록되어 있습니다.
          </p>
        </div>
        <Button onClick={handleOpenModal} className="shrink-0">
          <UserPlus className="mr-2 h-4 w-4" /> 상담원 등록
        </Button>
      </div>

      {/* 2. 검색 및 필터 영역 */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <Input 
          placeholder="이름, 사번, 이메일로 검색..." 
          className="border-0 focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 3. 데이터 테이블 */}
      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">상태</TableHead>
              <TableHead>이름 / 이메일</TableHead>
              <TableHead>사번</TableHead>
              <TableHead>일일 배정량</TableHead>
              <TableHead>역할</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : filteredAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredAgents.map((agent) => (
                <TableRow key={agent.agent_id}>
                  <TableCell>
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{agent.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{agent.name}</span>
                        <span className="text-xs text-muted-foreground">{agent.account_email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{agent.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <span className="font-bold">{agent.daily_cap}</span>
                       <span className="text-xs text-muted-foreground">건/일</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{agent.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>작업</DropdownMenuLabel>
                        <DropdownMenuItem>정보 수정</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">등록 해제</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 4. 등록 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>새로운 상담원 등록</DialogTitle>
            <DialogDescription>
              일반 계정을 상담원으로 승격시킵니다. 사번은 자동 생성됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {candidates.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                등록 가능한 후보자가 없습니다. <br/>(모든 직원이 이미 등록되었거나 없습니다)
              </div>
            ) : (
              candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{candidate.email}</span>
                    <span className="text-xs text-muted-foreground">ID: {candidate.id}</span>
                  </div>
                  <Button size="sm" onClick={() => handleCreate(candidate.id)}>
                    <Plus className="w-4 h-4 mr-1" /> 선택
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}