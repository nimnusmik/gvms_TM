// src/features/auth/types/index.ts
// 1. 유저 정보 (서버에서 주는 User 모델 모양)
export interface User {
    account_id: number;
    email: string;
    level: {
      level_id: number;
      level_name: string;
    };
    is_active: boolean;
    last_login_at: string;
  }
  
// 2. 로그인할 때 우리가 서버로 보낼 데이터
export interface LoginCredentials {
  email: string;
  password: string;
}

// 3. 회원가입할 때 우리가 서버로 보낼 데이터
export interface SignupCredentials {
  email: string;
  password: string;
}

// 4. 로그인 성공했을 때 서버가 주는 응답 데이터 (토큰 + 유저정보)
export interface AuthResponse {
  access: string;  // 액세스 토큰
  refresh: string; // 리프레시 토큰
  user: User;      // 위에서 정의한 User 정보
}