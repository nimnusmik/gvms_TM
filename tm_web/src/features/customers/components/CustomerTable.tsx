import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeamBadge } from "@/components/common/TeamBadge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Customer } from "../types";



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
    <div className="bg-white rounded-lg shadow border overflow-hidden">
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              이름
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              전화번호
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              관심분야
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              상태
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              담당자
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              등록일
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {isLoading ? (
            <tr>
              {/* 👇 컬럼 개수에 맞춰 colSpan을 7으로 수정 (체크박스 포함) */}
              <td colSpan={7} className="text-center py-20 text-gray-400">
                로딩 중...
              </td>
            </tr>
          ) : customers.length === 0 ? (
            <tr>
              {/* 👇 여기도 7으로 수정 */}
              <td colSpan={7} className="text-center py-20 text-gray-400">
                데이터가 없습니다.
              </td>
            </tr>
          ) : (
            customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    checked={selectedIds.includes(customer.id)}
                    onChange={() => onSelectRow(customer.id)}
                  />
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="text-gray-900 font-medium">{customer.name}</span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="text-gray-900 font-medium">{customer.phone}</span>
                </td>

                {/* ✨ [수정] TeamBadge 사용법 수정 */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {/* 이미 TeamBadge 안에서 '미배정' 처리를 하므로 그냥 넣으면 됩니다 */}
                  <TeamBadge team={customer.team} />
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    variant="outline"
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border-0 ${
                      customer.status === "NEW"
                        ? "bg-green-100 text-green-800"
                        : customer.status === "ASSIGNED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {customer.status}
                  </Badge>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {customer.assigned_agent ? (
                    <span className="text-gray-900 font-medium">
                      {customer.agent_name}
                    </span>
                  ) : (
                    <span className="text-gray-400 bg-gray-100 px-2 py-1 rounded-md text-xs">
                      미배정
                    </span>
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

      {/* 페이지네이션 영역 (기존 코드 유지) */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t sm:px-6">
         {/* ... (생략) ... */}
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