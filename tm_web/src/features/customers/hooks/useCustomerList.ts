import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { customerApi } from "../api/customerApi";
import type { SalesAssignment } from "../types";

const PAGE_SIZE = 50;

export function useCustomerList() {
  const [customers, setCustomers] = useState<SalesAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [agentFilter, setAgentFilter] = useState("ALL");
  const [secondaryStatusFilter, setSecondaryStatusFilter] = useState("ALL");
  const [secondaryAgentFilter, setSecondaryAgentFilter] = useState("ALL");
  const prevFilterKey = useRef<string>("");

  const fetchData = useCallback(
    async (targetPage: number) => {
      setIsLoading(true);
      try {
        const data = await customerApi.getCustomers({
          page: targetPage,
          search: activeSearch,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          agentId: agentFilter === "ALL" ? undefined : agentFilter,
          secondaryStatus: secondaryStatusFilter === "ALL" ? undefined : secondaryStatusFilter,
          secondaryAgentId: secondaryAgentFilter === "ALL" ? undefined : secondaryAgentFilter,
        });

        setCustomers(data.results);
        const count = data.count || 0;
        setTotalCount(count);
        setTotalPages(Math.ceil(count / PAGE_SIZE) || 1);
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
        toast.error("데이터 로딩 실패");
      } finally {
        setIsLoading(false);
      }
    },
    [activeSearch, statusFilter, agentFilter, secondaryStatusFilter, secondaryAgentFilter]
  );

  const filterKey = `${activeSearch}|${statusFilter}|${agentFilter}|${secondaryStatusFilter}|${secondaryAgentFilter}`;

  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    fetchData(page);
  }, [page, filterKey, fetchData]);

  const applySearch = useCallback(() => {
    setActiveSearch(searchTerm);
  }, [searchTerm]);

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setActiveSearch("");
    setStatusFilter("ALL");
    setAgentFilter("ALL");
    setSecondaryStatusFilter("ALL");
    setSecondaryAgentFilter("ALL");
  }, []);

  const reloadPage = useCallback(() => {
    fetchData(page);
  }, [fetchData, page]);

  const reloadFirstPage = useCallback(() => {
    if (page === 1) {
      fetchData(1);
    } else {
      setPage(1);
    }
  }, [fetchData, page]);

  return {
    customers,
    isLoading,
    page,
    setPage,
    totalPages,
    totalCount,
    searchTerm,
    setSearchTerm,
    activeSearch,
    statusFilter,
    setStatusFilter,
    agentFilter,
    setAgentFilter,
    secondaryStatusFilter,
    setSecondaryStatusFilter,
    secondaryAgentFilter,
    setSecondaryAgentFilter,
    applySearch,
    resetFilters,
    reloadPage,
    reloadFirstPage,
  };
}
