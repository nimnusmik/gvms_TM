import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://10.0.2.2:8000/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 로그아웃 콜백 (AppNavigator에서 설정)
let _logoutCallback = null;
export const setLogoutCallback = (cb) => { _logoutCallback = cb; };

client.interceptors.request.use(
  async (config) => {
    if (!config.url.includes('/auth/')) {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('no refresh token');
        const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh: refreshToken });
        const newAccess = res.data.access;
        await SecureStore.setItemAsync('accessToken', newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return client(original);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        if (_logoutCallback) _logoutCallback();
      }
    }
    return Promise.reject(error);
  }
);

export default client;
