import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://simpleforum-1m94.onrender.com';

const ACCESS_KEY = 'simpleforum_access';
const REFRESH_KEY = 'simpleforum_refresh';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const access = localStorage.getItem(ACCESS_KEY);
    if (access) {
      config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (['/auth/login/', '/auth/registration/'].some(path => originalRequest.url?.includes(path))) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (!refreshToken) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${API_URL}/auth/token/refresh/`,
          { refresh: refreshToken },
        );

        localStorage.setItem(ACCESS_KEY, data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;

        return axiosInstance(originalRequest);
      } catch {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export { ACCESS_KEY, REFRESH_KEY };

export default axiosInstance;
