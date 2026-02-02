// src/features/auth/hooks/useAuthStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storage } from "@/lib/storage"; // storage 유틸리티 import

interface User {
  id?: number;        // id는 없을 수도 있으므로 optional (?)
  email: string;
  name?: string;
  is_staff?: boolean; // 관리자 여부 체크용
}

interface AuthState {
  token: string | null;        // Access Token
  refreshToken: string | null; // Refresh Token (추가됨)
  user: User | null;
  isAuthenticated: boolean;
  
  login: (token: string, refreshToken: string, user: User) => void;
  
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      
      // ✅ 로그인: 상태 업데이트 + 로컬 스토리지 물리 저장 동기화
      login: (token, refreshToken, user) => {
        // 1. storage 유틸리티를 통해 저장 (Axios 등에서 직접 접근할 때 대비)
        storage.setToken(token);
        storage.setRefreshToken(refreshToken);

        // 2. Zustand 상태 업데이트
        set({ 
          token, 
          refreshToken, 
          user, 
          isAuthenticated: true 
        });
      },
      
      // ✅ 로그아웃: 상태 초기화 + 로컬 스토리지 비우기
      logout: () => {
        storage.clearTokens();
        set({ 
          token: null, 
          refreshToken: null, 
          user: null, 
          isAuthenticated: false 
        });
      },
    }),
    {
      name: "auth-storage", // localStorage에 저장될 키 이름 (Zustand용)
      storage: createJSONStorage(() => localStorage),
    }
  )
);