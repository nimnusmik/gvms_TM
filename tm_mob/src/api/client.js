import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
// Platform 임포트 제거하셔도 됩니다.

// Android 에뮬레이터는 호스트 PC를 10.0.2.2로 접근합니다.
const BASE_URL = 'http://10.0.2.2:8000/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 5000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(
  async (config) => {
    // 로그인/회원가입 요청일 때는 토큰을 꺼내지 않음 (무한루틴 방지)
    if (!config.url.includes('/auth/login')) {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default client;
