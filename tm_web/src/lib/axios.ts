// /Users/sunminkim/Desktop/gv_TM/tm_web/src/lib/axios.ts
import axios from 'axios';

// 🔥 현재 호스트에 맞춰서 자동으로 API 주소 설정
const getBaseURL = () => {
  const { hostname } = window.location;
  
  // localhost면 → Django도 localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api/v1';
  }
  
  // IP 주소로 접속했으면 → 같은 IP의 8000번 포트
  return `http://${hostname}:8000/api/v1`;
};

// 1. 기본 설정 (주소, 타임아웃 등)
export const api = axios.create({
  baseURL: getBaseURL(), // ← 변경!
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true, // 나중에 쿠키 쓸 때 필요
});

// 디버깅용 (개발 중에만)
console.log('🚀 API Base URL:', api.defaults.baseURL);

// 2. 요청 인터셉터 (갈 때) - 자동으로 토큰 싣기 🚚
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. 응답 인터셉터 (올 때) - 에러 공통 처리 🚨
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 예: 401 에러(토큰 만료)면 자동으로 로그아웃 시키기 등의 로직 가능
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login/')) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);