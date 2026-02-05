import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Phone } from "lucide-react"; // MapPin 제거
import type { Customer } from "../types";
import { formatPhoneNumber } from "@/lib/formatter";

interface CustomerTableProps {
  customers: Customer[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  selectedIds: number[];
  onSelectAll: (checked: boolean) => void;
  onSelectRow: (id: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function CustomerTable({
  customers,
  isLoading,
  page,
  totalPages,
  selectedIds,
  onSelectAll,
  onSelectRow,
  onPrevPage,
  onNextPage,
}: CustomerTableProps) {
  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 w-4">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  checked={customers.length > 0 && selectedIds.length === customers.length}
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </th>
              {/* 1. 이름 */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                고객명
              </th>
              {/* 2. 연락처 */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                연락처
              </th>

              {/* 3,4,5. 분야 1, 2, 3 */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                분야1
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                분야2
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                분야3
              </th>

              {/* ❌ 지역 컬럼 제거됨 */}
              
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                담당자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                통화
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                등록일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="text-center py-20 text-gray-400"> {/* colSpan 수정: 11 -> 10 */}
                  데이터를 불러오는 중입니다...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-20 text-gray-400"> {/* colSpan 수정: 11 -> 10 */}
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  {/* 체크박스 */}
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      checked={selectedIds.includes(customer.id)}
                      onChange={() => onSelectRow(customer.id)}
                    />
                  </td>

                  {/* 1. 이름 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]" title={customer.name}>
                      {customer.name}
                    </div>
                  </td>

                  {/* 2. 연락처 */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {formatPhoneNumber(customer.phone)}
                    </div>
                  </td>

                  {/* 3. 분야1 */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {customer.category_1 ? (
                      <span className="truncate max-w-[120px] block" title={customer.category_1}>
                        {customer.category_1}
                      </span>
                    ) : "-"}
                  </td>

                  {/* 4. 분야2 */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.category_2 ? (
                      <span className="truncate max-w-[120px] block" title={customer.category_2}>
                        {customer.category_2}
                      </span>
                    ) : "-"}
                  </td>

                  {/* 5. 분야3 */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.category_3 ? (
                      <span className="truncate max-w-[120px] block" title={customer.category_3}>
                        {customer.category_3}
                      </span>
                    ) : "-"}
                  </td>

                  {/* ❌ 지역 데이터 제거됨 */}

                  {/* 6. 담당자 */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {customer.agent_name && customer.agent_name !== "-" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                        {customer.agent_name}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">미배정</span>
                    )}
                  </td>

                  {/* 7. 상태 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border-0 ${
                        customer.status === "NEW"
                          ? "bg-green-100 text-green-800"
                          : customer.status === "ASSIGNED"
                            ? "bg-blue-100 text-blue-800"
                            : customer.status === "SUCCESS"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {customer.status}
                    </Badge>
                  </td>

                  {/* 8. 통화 횟수 */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                     <span className={`text-xs font-mono font-bold px-2 py-1 rounded-md ${
                       (customer.call_count || 0) > 0 ? 'bg-orange-50 text-orange-600' : 'text-gray-300'
                     }`}>
                       {customer.call_count || 0}회
                     </span>
                  </td>

                  {/* 9. 등록일 */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 (기존과 동일) */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t sm:px-6 mt-auto">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              현재 <span className="font-medium">{page}</span> /{" "}
              <span className="font-medium">{totalPages}</span> 페이지
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <Button
                variant="outline"
                className="rounded-l-md px-2 py-2"
                onClick={onPrevPage}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="rounded-r-md px-2 py-2"
                onClick={onNextPage}
                disabled={page === totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}