import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Progress Bar & Global Loading Event Emitters
let activeRequests = 0;

const notifyStart = () => {
  activeRequests++;
  if (activeRequests === 1 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('salon:request-start'));
  }
};

const notifyEnd = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('salon:request-end'));
  }
};

// Request Interceptor: Attach Access Token & trigger Progress Bar
api.interceptors.request.use(
  (config) => {
    notifyStart();
    const token = localStorage.getItem('nagulan_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    notifyEnd();
    return Promise.reject(error);
  }
);

// Response Interceptor: Auto Refresh Token on 401 & finish Progress Bar
api.interceptors.response.use(
  (response) => {
    notifyEnd();
    return response;
  },
  async (error) => {
    notifyEnd();
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('nagulan_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh-token', { token: refreshToken });
          if (res.data.success) {
            localStorage.setItem('nagulan_token', res.data.accessToken);
            if (res.data.refreshToken) {
              localStorage.setItem('nagulan_refresh_token', res.data.refreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('nagulan_token');
          localStorage.removeItem('nagulan_refresh_token');
          localStorage.removeItem('nagulan_user');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('nagulan_token');
        localStorage.removeItem('nagulan_refresh_token');
        localStorage.removeItem('nagulan_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
