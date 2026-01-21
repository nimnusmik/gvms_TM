// src/features/auth/api/authApi.ts
import { api } from '@/lib/axios'; // 위에서 만든 중앙 api 사용
import { LoginCredentials, SignupCredentials, AuthResponse } from '../types/index';

export const authApi = {
  // 로그인
  login: async (data: LoginCredentials) => {
    const response = await api.post<AuthResponse>('/auth/login/', data); //로그인 정보를 Post 해달라
    return response.data;
  },
  
  // 회원가입 (새로 추가!)
  signup: async (data: SignupCredentials) => {
    const response = await api.post('/accounts/', data); // ModelViewSet 주소
    return response.data;
  },
};