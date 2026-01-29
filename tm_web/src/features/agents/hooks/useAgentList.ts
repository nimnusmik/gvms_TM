// src/features/agents/hooks/useAgentList.ts
import { useState, useEffect, useCallback } from "react";
import { agentApi } from "../api/agentApi";
import type { Agent } from "../types/index";
import { toast } from "sonner";

export function useAgentList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 데이터 불러오기
  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await agentApi.getAgents();
      setAgents(data);
    } catch (error) {
      console.error(error);
      toast.error("데이터 로딩 실패");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로딩
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return { agents, isLoading, refresh: fetchAgents };
}