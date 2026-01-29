// src/lib/storage.ts
// localStorage 키 값을 여기서만 관리! (오타 방지)
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
  };
  
  export const storage = {
    // 1. Access Token 관련
    getToken: () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
    setToken: (token: string) => localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token),
    removeToken: () => localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
  
    // 2. Refresh Token 관련 (이게 추가되어야 완벽합니다! ✨)
    getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
    setRefreshToken: (token: string) => localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token),
    removeRefreshToken: () => localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    
    // 3. 로그아웃 시 둘 다 한방에 지우는 헬퍼 함수 (선택사항)
    clearTokens: () => {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
  };