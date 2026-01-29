import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { customerApi } from "../api/customerApi";
import type { Customer } from "../types";

const PAGE_SIZE = 10;

export function useCustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const prevFilterKey = useRef<string>("");

  const fetchData = useCallback(
    async (targetPage: number) => {
      setIsLoading(true);
      try {
        const data = await customerApi.getCustomers({
          page: targetPage,
          search: activeSearch,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        });

        setCustomers(data.results);
        const totalCount = data.count || 0;
        setTotalPages(Math.ceil(totalCount / PAGE_SIZE) || 1);
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
        toast.error("데이터 로딩 실패");
      } finally {
        setIsLoading(false);
      }
    },
    [activeSearch, statusFilter]
  );

  const filterKey = `${activeSearch}|${statusFilter}`;

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
    searchTerm,
    setSearchTerm,
    activeSearch,
    statusFilter,
    setStatusFilter,
    applySearch,
    resetFilters,
    reloadPage,
    reloadFirstPage,
  };
}
