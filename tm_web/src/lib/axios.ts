// 매번 http://localhost:8000...을 치는 건 하수입니다. Axios 인스턴스를 하나만 잘 만들어두면 주소 관리와 토큰 관리가 자동화됩니다.
import axios from 'axios';

// 1. 기본 설정 (주소, 타임아웃 등)
export const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1', // 공통 주소
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true, // 나중에 쿠키 쓸 때 필요
});

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
    return Promise.reject(error);
  }
);