import { useEffect, useState } from "react";
import { agentApi } from "../api/agentApi";
import { Agent, AgentRole } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, MoreHorizontal, UserPlus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function AgentManagementPage() {
  //const { user } = useAuthStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

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
    // 1. 후보자 정보 찾기
    const candidate = candidates.find((c) => c.id === accountId);
    if (!candidate) return;

    // 2. 확인 메시지 (이름이 이미 있으니까 바로 확인)
    // candidate.name이 가입할 때 쓴 진짜 이름입니다.
    if (!confirm(`${candidate.name} 님을 상담원으로 등록하시겠습니까?`)) return;

    try {
      await agentApi.createAgent({
        account_id: accountId,
        name: candidate.name, //가입할 때 쓴 이름을 그대로 토스!
        daily_cap: 50,
        role: AgentRole.AGENT,
      });
      toast("등록되었습니다.");
      setIsModalOpen(false);
      fetchAgents();
    } catch (error) {
      toast("등록 실패");
    }
  };

  // 🗑️ 삭제 핸들러
  const handleDelete = async (agentId: string) => {
    if (!confirm("정말 이 상담원 등록을 해제하시겠습니까?\n(일반 직원 계정은 유지됩니다)")) return;
    
    try {
      await agentApi.deleteAgent(agentId);
      toast("해제되었습니다.");
      fetchAgents(); // 목록 새로고침
    } catch (error) {
      toast("삭제 실패: 시스템 오류");
    }
  };

  // 📝 수정 저장 핸들러
  const handleUpdateSave = async () => {
    if (!editingAgent) return;
    try {
      await agentApi.updateAgent(editingAgent.agent_id, {
        daily_cap: editingAgent.daily_cap,
        status: editingAgent.status,
        role: editingAgent.role
      });
      toast("수정되었습니다.");
      setEditingAgent(null); // 모달 닫기
      fetchAgents(); // 목록 새로고침
    } catch (error) {
      toast.error("수정 실패");
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
                      <DropdownMenuContent align="end"
                      className="bg-white border shadow-lg">
                        <DropdownMenuLabel></DropdownMenuLabel>

                        <DropdownMenuItem onClick={() => setEditingAgent(agent)}>
                          정보 수정
                        </DropdownMenuItem>
                        
                        {/* 👇 삭제 버튼: 핸들러 연결 */}
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600 focus:bg-red-50" // 마우스 올렸을 때 살짝 붉게
                          onClick={() => handleDelete(agent.agent_id)}
                        >등록 해제</DropdownMenuItem>
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
                    
                    <span className="font-bold text-base">
                      {candidate.name}
                      {!candidate.name && <span className="text-xs text-red-400 font-normal ml-2">(이름 미입력)</span>}
                    </span>
                    <span className="text-xs text-muted-foreground">{candidate.email}</span>

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

      {/* 🛠️ 상담원 수정 모달 */}
      <Dialog open={!!editingAgent} onOpenChange={(open) => !open && setEditingAgent(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>상담원 정보 수정</DialogTitle>
            <DialogDescription>
              {editingAgent?.name} ({editingAgent?.code})님의 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          
          {editingAgent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">일일 배정량</label>
                <Input
                  type="number"
                  value={editingAgent.daily_cap}
                  onChange={(e) => setEditingAgent({ ...editingAgent, daily_cap: Number(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                 <label className="text-right text-sm font-medium">상태</label>
                 {/* 간단하게 select로 구현 (나중에 shadcn Select로 고도화 가능) */}
                 <select 
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={editingAgent.status}
                    onChange={(e) => setEditingAgent({ ...editingAgent, status: e.target.value as any })}
                 >
                    <option value="ONLINE">ONLINE</option>
                    <option value="OFFLINE">OFFLINE</option>
                    <option value="BUSY">BUSY</option>
                    <option value="BREAK">BREAK</option>
                 </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
             <Button variant="outline" onClick={() => setEditingAgent(null)}>취소</Button>
             <Button onClick={handleUpdateSave}>저장하기</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}