// src/features/customers/pages/CustomerManagementPage.tsx
import { useState, useEffect, useRef } from 'react'; 
import { customerApi } from '../api/customerApi';
import type { Customer } from '@/features/customers/types';
import AssignAgentModal from '../components/AssignAgentModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight, RefreshCcw, X, UploadCloud } from 'lucide-react'; // ✨ UploadCloud 추가
import { toast } from "sonner"; 

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // ✨ [추가] 업로드 상태 관리
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 페이지네이션 상태
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  // 필터 상태
  const [searchTerm, setSearchTerm] = useState(""); 
  const [activeSearch, setActiveSearch] = useState(""); 
  const [statusFilter, setStatusFilter] = useState("ALL"); 

  // 선택 상태
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 데이터 로딩
  const fetchData = async (targetPage: number) => {
    setIsLoading(true);
    try {
      const data = await customerApi.getCustomers({ 
        page: targetPage,
        search: activeSearch,
        status: statusFilter === "ALL" ? undefined : statusFilter
      })
    
      setCustomers(data.results);
      const totalCount = data.count || 0;
      setTotalPages(Math.ceil(totalCount / PAGE_SIZE) || 1);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
    setSelectedIds([]); 
  }, [page]);

  useEffect(() => {
    setPage(1); 
    fetchData(1);
  }, [statusFilter, activeSearch]);

  // ✨ [추가] 엑셀 업로드 핸들러
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 1. 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("파일 크기는 10MB를 넘을 수 없습니다.");
      return;
    }
    
    // 2. 확인 메시지
    if (!confirm(`'${file.name}' 파일을 업로드하시겠습니까? \n(대량 업로드 시 시간이 걸릴 수 있습니다)`)) {
      e.target.value = ""; // 취소 시 초기화
      return;
    }
    
    setIsUploading(true);
    try {
      // API 호출
      const response = await customerApi.uploadExcel(file);
      toast.success(response.message || "업로드가 완료되었습니다!");
      
      // 성공 시 목록 새로고침 (1페이지로 이동)
      setPage(1);
      fetchData(1);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "업로드 실패: 파일 형식을 확인해주세요.";
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
      // 파일 입력 초기화 (같은 파일 다시 올릴 수 있게)
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setActiveSearch(searchTerm);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(customers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAssign = async (agentId: string) => {
    await customerApi.bulkAssign({ ids: selectedIds, agent_id: agentId });
    toast.success(`성공적으로 ${selectedIds.length}명을 배정했습니다.`);
    setSelectedIds([]);
    fetchData(page);
  };

  return (
    <div className="p-6 space-y-4">
      {/* 1. 상단 헤더 & 버튼 영역 */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
           <div>
             <h1 className="text-2xl font-bold text-gray-900">고객 DB 관리</h1>
             <p className="text-sm text-gray-500 mt-1">총 {customers.length}개의 리드가 조회되었습니다.</p>
           </div>
           
           {/* ✨ [수정] 버튼 그룹 (업로드 + 새로고침) */}
           <div className="flex gap-2">
             {/* 숨겨진 파일 입력창 */}
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload}
                className="hidden" 
                accept=".xlsx, .xls"
             />
             
             {/* 업로드 버튼 */}
             <Button 
                variant="default" // 파란색 강조
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploading}
                className="shadow-sm"
             >
                <UploadCloud className="mr-2 h-4 w-4" />
                {isUploading ? "업로드 중..." : "엑셀 업로드"}
             </Button>

             {/* 새로고침 버튼 */}
             <Button variant="outline" size="icon" onClick={() => fetchData(page)} title="새로고침">
                <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}/>
             </Button>
           </div>
        </div>

        {/* 검색 및 필터 툴바 */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg border shadow-sm">
           <div className="relative flex-1 min-w-[200px]">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
             <Input 
               placeholder="고객명, 전화번호 검색 (Enter)" 
               className="pl-9 bg-gray-50 border-gray-200"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               onKeyDown={handleSearchKeyDown}
             />
           </div>

           <select 
             className="h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
           >
             <option value="ALL">모든 상태</option>
             <option value="NEW">접수 (NEW)</option>
             <option value="ASSIGNED">배정됨 (ASSIGNED)</option>
             <option value="SUCCESS">성공 (SUCCESS)</option>
             <option value="REJECT">거절 (REJECT)</option>
           </select>

           {(activeSearch || statusFilter !== "ALL") && (
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => {
                 setSearchTerm("");
                 setActiveSearch("");
                 setStatusFilter("ALL");
               }}
               className="text-red-500 hover:text-red-600 hover:bg-red-50"
             >
               <X className="w-4 h-4 mr-1"/> 초기화
             </Button>
           )}
        </div>
      </div>

      {/* 일괄 작업 액션 바 */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-between animate-fade-in-down">
          <span className="text-blue-800 font-semibold ml-2">
            <span className="text-xl font-bold">{selectedIds.length}</span>명 선택됨
          </span>
          <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            상담원 배정하기
          </Button>
        </div>
      )}

      {/* 테이블 영역 */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 w-4">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  checked={customers.length > 0 && selectedIds.length === customers.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-20 text-gray-400">로딩 중...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-20 text-gray-400">데이터가 없습니다.</td></tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      checked={selectedIds.includes(customer.id)}
                      onChange={() => handleSelectRow(customer.id)}
                    />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {customer.name? (
                      <span className="text-gray-900 font-medium">
                          {customer.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 bg-gray-100 px-2 py-1 rounded-md text-xs">
                          미배정
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${customer.status === 'NEW' ? 'bg-green-100 text-green-800' : 
                        customer.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {customer.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {customer.agent_name ? (
                        <span className="text-gray-900 font-medium">{customer.agent_name}</span>
                    ) : (
                        <span className="text-gray-400 bg-gray-100 px-2 py-1 rounded-md text-xs">미배정</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 페이지네이션 */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700">
                        현재 <span className="font-medium">{page}</span> / <span className="font-medium">{totalPages}</span> 페이지
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <Button
                            variant="outline"
                            className="rounded-l-md px-2 py-2"
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1 || isLoading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-r-md px-2 py-2"
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages || isLoading}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </nav>
                </div>
            </div>
        </div>
      </div>

      <AssignAgentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleBulkAssign}
        selectedCount={selectedIds.length}
      />
    </div>
  );
}