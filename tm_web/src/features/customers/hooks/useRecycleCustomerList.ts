import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { customerApi } from "../api/customerApi";
import type { SalesAssignment } from "../types";

const PAGE_SIZE = 50;

export function useRecycleCustomerList() {
  const [customers, setCustomers] = useState<SalesAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const prevFilterKey = useRef<string>("");

  const fetchData = useCallback(
    async (targetPage: number) => {
      setIsLoading(true);
      try {
        const data = await customerApi.getRecycleCandidates({
          page: targetPage,
          search: activeSearch,
        });
        setCustomers(data.results);
        const count = data.count || 0;
        setTotalCount(count);
        setTotalPages(Math.ceil(count / PAGE_SIZE) || 1);
      } catch (error) {
        console.error("재활용 DB 로딩 실패:", error);
        toast.error("재활용 DB 로딩 실패");
      } finally {
        setIsLoading(false);
      }
    },
    [activeSearch]
  );

  const filterKey = `${activeSearch}`;

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
  }, []);

  const reloadPage = useCallback(() => {
    fetchData(page);
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
    applySearch,
    resetFilters,
    reloadPage,
  };
}
