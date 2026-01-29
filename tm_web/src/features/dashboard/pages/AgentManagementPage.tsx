import { useEffect, useState } from "react";
import { agentApi } from "../api/agentApi";
import { Agent } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, MoreHorizontal, ArrowLeft, UserPlus, Filter } from "lucide-react";import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function AgentManagementPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null); // 선택된 후보자
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const TEAMS = [
    { value: 'BATTERY', label: '배터리' },
    { value: 'MOBILITY', label: '모빌리티' },
    { value: 'SOLAR', label: '태양광' },
    { value: 'MACHINE', label: '산업기계' },
  ];
  const [newAgentConfig, setNewAgentConfig] = useState({
    daily_cap: 50, // 기본값
    team: 'BATTERY' // 기본값
  });

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

  const handleFinalCreate = async () => {
    if (!selectedCandidate) return;
    
    try {
      await agentApi.createAgent({
        account_id: selectedCandidate.id,
        daily_cap: newAgentConfig.daily_cap,
        team: newAgentConfig.team
      });
      
      toast.success(`${selectedCandidate.name}님이 상담원으로 등록되었습니다.`);
      setIsModalOpen(false);
      setSelectedCandidate(null); // 초기화
      fetchAgents(); // 목록 새로고침
    } catch (error) {
      console.error(error);
      toast.error("등록 실패");
    }
  };

  // 모달 닫힐 때 초기화
  useEffect(() => {
    if (!isModalOpen) {
      setSelectedCandidate(null);
      setNewAgentConfig({ daily_cap: 50, team: 'BATTERY' });
    }
  }, [isModalOpen]);


  const handleDelete = async (agentId: string) => {
    if (!confirm("정말 이 상담원 등록을 해제하시겠습니까?\n(일반 직원 계정은 유지됩니다)")) return;
    try {
      await agentApi.deleteAgent(agentId);
      toast.success("해제되었습니다.");
      fetchAgents();
    } catch (error) {
      toast.error("삭제 실패: 시스템 오류");
    }
  };

  const handleUpdateSave = async () => {
    if (!editingAgent) return;
    try {
      await agentApi.updateAgent(editingAgent.agent_id, {
        daily_cap: editingAgent.daily_cap,
        status: editingAgent.status,
        role: editingAgent.role,
        team: editingAgent.team
      });
      toast.success("수정되었습니다.");
      setEditingAgent(null); // 모달 닫기

      fetchAgents();

    } catch (error) {
      toast.error("수정 실패");
    }
  };

  const filteredAgents = agents.filter(agent => 
    agent.name.includes(searchTerm) || 
    agent.code?.includes(searchTerm) ||
    agent.account_email?.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ONLINE": return "bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200";
      case "BUSY": return "bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-200";
      case "BREAK": return "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 border-yellow-200";
      default: return "bg-slate-500/10 text-slate-700 hover:bg-slate-500/20 border-slate-200";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 1. 헤더 영역 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">상담원 관리</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            현재 활동 중인 상담원 <span className="font-semibold text-blue-600">{agents.length}명</span>을 관리합니다.
          </p>
        </div>
        <Button onClick={handleOpenModal} className="shrink-0 shadow-sm bg-blue-600 hover:bg-blue-700">
          <UserPlus className="mr-2 h-4 w-4" /> 상담원 신규 등록
        </Button>
      </div>

      {/* 2. 툴바 (검색 & 필터) */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-gray-50 rounded-md px-3 border focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <Search className="w-4 h-4 text-gray-400" />
          <Input 
            placeholder="이름, 사번, 이메일 검색..." 
            className="border-0 bg-transparent focus-visible:ring-0 placeholder:text-gray-400 h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="ml-2 text-gray-600">
            <Filter className="w-4 h-4 mr-2"/> 필터
        </Button>
      </div>

      {/* 3. 테이블 */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="w-[100px]">상태</TableHead>
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
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  데이터를 불러오는 중입니다...
                </TableCell>
              </TableRow>
            ) : filteredAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredAgents.map((agent) => (
                <TableRow key={agent.agent_id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <Badge variant="outline" className={`font-medium border ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {agent.team ? (
                      <Badge variant="secondary" className="font-normal">
                        {TEAMS.find(t => t.value === agent.team)?.label || agent.team}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-xs">미배정</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border">
                        <AvatarFallback className="bg-blue-50 text-blue-600 text-xs">
                          {agent.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-gray-900">{agent.name}</span>
                        <span className="text-xs text-gray-500">{agent.account_email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-500">{agent.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                       <span className="font-bold text-gray-700">{agent.daily_cap}</span>
                       <span className="text-xs text-gray-400">건/일</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal text-gray-600">
                      {agent.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuLabel>계정 관리</DropdownMenuLabel>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem onClick={() => setEditingAgent(agent)} className="cursor-pointer">
                          정보 수정
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                          onClick={() => handleDelete(agent.agent_id)}
                        >
                          등록 해제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white"> {/* bg-white 추가 */}
          <DialogHeader>
            <DialogTitle>상담원 신규 등록</DialogTitle>
            <DialogDescription>
              {selectedCandidate 
                ? "상담원의 초기 업무 환경을 설정해주세요." 
                : "일반 직원을 상담원으로 승격시킵니다."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[400px] overflow-y-auto">
            {!selectedCandidate ? (
              // [단계 1] 후보자 목록 보여주기
              <div className="space-y-2">
                {candidates.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8 bg-gray-50 rounded-lg border border-dashed">
                    등록 가능한 후보자가 없습니다.
                  </div>
                ) : (
                  candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer group"
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-800 group-hover:text-blue-700">
                          {candidate.name || "이름 없음"}
                        </span>
                        <span className="text-xs text-muted-foreground">{candidate.email}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="group-hover:bg-blue-100 group-hover:text-blue-700">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // [단계 2] 상세 설정 (팀 & 배정량)
              <div className="space-y-4 px-1">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mb-4">
                  <span className="text-sm text-blue-800 font-bold">{selectedCandidate.name}</span>
                  <span className="text-xs text-blue-600 ml-2">({selectedCandidate.email})</span>
                </div>

                {/* 소속 팀 선택 */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-gray-600">소속 팀</label>
                  <select 
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    value={newAgentConfig.team}
                    onChange={(e) => setNewAgentConfig({ ...newAgentConfig, team: e.target.value })}
                  >
                    {TEAMS.map(team => (
                      <option key={team.value} value={team.value}>{team.label}</option>
                    ))}
                  </select>
                </div>

                {/* 일일 배정량 입력 */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-gray-600">일일 배정량</label>
                  <Input
                    type="number"
                    value={newAgentConfig.daily_cap}
                    onChange={(e) => setNewAgentConfig({ ...newAgentConfig, daily_cap: Number(e.target.value) })}
                    className="col-span-3 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-2">
            {selectedCandidate ? (
              <>
                <Button variant="outline" onClick={() => setSelectedCandidate(null)}>
                  <ArrowLeft className="w-4 h-4 mr-2"/> 뒤로
                </Button>
                <Button onClick={handleFinalCreate}>등록 완료</Button>
              </>
            ) : (
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>닫기</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. ✨ [수정] 정보 수정 모달 (팀 변경 추가 & 배경 흰색 적용) */}
      <Dialog open={!!editingAgent} onOpenChange={(open) => !open && setEditingAgent(null)}>
        <DialogContent className="sm:max-w-[425px] bg-white"> {/* bg-white 추가 */}
          <DialogHeader>
            <DialogTitle>상담원 정보 수정</DialogTitle>
            <DialogDescription>
              {editingAgent?.name} 님의 업무 설정을 변경합니다.
            </DialogDescription>
          </DialogHeader>
          
          {editingAgent && (
            <div className="grid gap-4 py-4">
              {/* 팀 수정 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium text-gray-600">소속 팀</label>
                <select 
                   className="col-span-3 flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                   value={editingAgent.team || ""}
                   onChange={(e) => setEditingAgent({ ...editingAgent, team: e.target.value || null })}
                >
                   <option value="">(미배정)</option>
                   {TEAMS.map(team => (
                     <option key={team.value} value={team.value}>{team.label}</option>
                   ))}
                </select>
              </div>

              {/* 배정량 수정 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium text-gray-600">일일 배정량</label>
                <Input
                  type="number"
                  value={editingAgent.daily_cap}
                  onChange={(e) => setEditingAgent({ ...editingAgent, daily_cap: Number(e.target.value) })}
                  className="col-span-3 bg-white"
                />
              </div>
              
              {/* 상태 수정 */}
              <div className="grid grid-cols-4 items-center gap-4">
                 <label className="text-right text-sm font-medium text-gray-600">현재 상태</label>
                 <select 
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    value={editingAgent.status}
                    onChange={(e) => setEditingAgent({ ...editingAgent, status: e.target.value as any })}
                 >
                    <option value="ONLINE">🟢 업무 가능 (ONLINE)</option>
                    <option value="OFFLINE">⚫ 오프라인 (OFFLINE)</option>
                    <option value="BUSY">🔴 통화 중 (BUSY)</option>
                    <option value="BREAK">🟡 휴식 중 (BREAK)</option>
                 </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
             <Button variant="outline" onClick={() => setEditingAgent(null)}>취소</Button>
             <Button onClick={handleUpdateSave}>변경사항 저장</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}