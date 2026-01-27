import { useEffect, useState, useRef } from "react";
import { customerApi } from "../api/customerApi";
import { agentApi } from "../api/agentApi"; 
import { Customer, CustomerStatus, Agent } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, Search, UserCog } from "lucide-react";
import { toast } from "sonner";

export default function CustomerManagementPage() {
  // 데이터 상태
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // 기능 상태
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 배정 모달 상태
  const [targetCustomer, setTargetCustomer] = useState<Customer | null>(null);
  
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  // 1. 초기 데이터 로딩
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [customerData, agentData] = await Promise.all([
        customerApi.getCustomers(),
        agentApi.getAgents()
      ]);
      setCustomers(customerData);
      setAgents(agentData);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. 엑셀 업로드 핸들러
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    // 파일 크기 체크 (선택 사항: 10MB 제한 등)
    if (file.size > 10 * 1024 * 1024) {
      toast("파일 크기는 10MB를 넘을 수 없습니다.");
      return;
    }
  
    if (!confirm(`'${file.name}' 파일을 업로드하시겠습니까? \n(대량 업로드 시 시간이 조금 걸릴 수 있습니다.)`)) {
      e.target.value = "";
      return;
    }
  
    setIsUploading(true);
    try {
      const response = await customerApi.uploadExcel(file);
      
      toast(`✅ ${response.message || "업로드가 완료되었습니다!"}`); 
      
      fetchData(); 
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "업로드 실패: 파일 형식을 확인해주세요.";
      toast(`❌ ${errorMsg}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 3. 상담원 배정 핸들러
  const handleAssign = async () => {
    if (!targetCustomer || !selectedAgentId) {
      toast("배정할 상담원을 선택해주세요!"); 
      return;
    }

    try {
      await customerApi.assignAgent(targetCustomer.id, selectedAgentId);
      toast("✅ 배정되었습니다.");
      setTargetCustomer(null); // 모달 닫기
      fetchData(); // 데이터 새로고침
    } catch (error) {
      console.error(error);
      toast.error("❌ 배정 실패: 서버 오류가 발생했습니다.");
    }
  };

  // 헬퍼: 상태 배지
  const getStatusBadge = (status: CustomerStatus) => {
    const styles: any = {
      NEW: "bg-slate-500",
      ASSIGNED: "bg-blue-500",
      SUCCESS: "bg-green-600",
      REJECT: "bg-red-500",
      TRYING: "bg-orange-400",
    };
    return <Badge className={`${styles[status] || "bg-gray-400"} hover:opacity-80`}>{status}</Badge>;
  };

  // 검색 필터
  const filteredCustomers = customers.filter(c => 
    c.name.includes(searchTerm) || c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">고객 DB 관리</h2>
          <p className="text-muted-foreground mt-1">
            업로드된 DB를 확인하고 상담원에게 배정합니다.
          </p>
        </div>
        
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            className="hidden" 
            accept=".xlsx, .xls"
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <UploadCloud className="mr-2 h-4 w-4" />
            {isUploading ? "업로드 중..." : "엑셀 DB 업로드"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border w-full md:w-1/3">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <Input 
          placeholder="고객명, 전화번호 검색" 
          className="border-0 focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">상태</TableHead>
              <TableHead>고객명</TableHead>
              <TableHead>전화번호</TableHead>
              <TableHead>담당 상담원</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center h-24">로딩 중...</TableCell></TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">데이터가 없습니다.</TableCell></TableRow>
            ) : (
              filteredCustomers.map((customer) => {
                const assignedAgent = agents.find(a => a.agent_id === String(customer.assigned_agent));
                
                return (
                  <TableRow key={customer.id}>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{customer.phone}</TableCell>
                    <TableCell>
                      {assignedAgent ? (
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded w-fit">
                           <UserCog className="w-3 h-3"/> {assignedAgent.name}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">미배정</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setTargetCustomer(customer);
                          setSelectedAgentId(customer.assigned_agent ? String(customer.assigned_agent) : "");
                        }}
                      >
                        배정 / 변경
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!targetCustomer} onOpenChange={(open) => !open && setTargetCustomer(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>상담원 배정</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="text-sm">
              <span className="font-bold">{targetCustomer?.name}</span> 고객님을 담당할 상담원을 선택하세요.
            </div>
            
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
            >
              <option value="" disabled>상담원 선택...</option>
              {agents.map((agent) => (
                <option key={agent.agent_id} value={agent.agent_id}>
                  {agent.name} ({agent.code}) - 현재 {agent.status}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setTargetCustomer(null)}>취소</Button>
            <Button onClick={handleAssign}>배정 완료</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}