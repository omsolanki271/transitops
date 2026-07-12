import axios from 'axios';

// Get base URL from env or default
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1/';

// Check if we should force Client-Side Mock Mode
export const isMockMode = () => {
  const envMock = import.meta.env.VITE_USE_MOCK;
  if (envMock !== undefined) {
    return envMock === 'true';
  }
  // Default to true for easy standalone evaluation if backend is not configured/live
  const localMock = localStorage.getItem('transitops_use_mock');
  return localMock !== 'false';
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('transitops_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Token refresh and error wrapping
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    // Return wrapped DRF envelope data
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle token refresh on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('transitops_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call base axios to avoid infinite loops
        const response = await axios.post(`${BASE_URL}auth/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.data.access;
        localStorage.setItem('transitops_token', newAccessToken);

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Logout user on token refresh failure
        localStorage.removeItem('transitops_token');
        localStorage.removeItem('transitops_user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Format server error to match the standard API Contract envelope
    const formattedError = {
      success: false,
      error: {
        code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
        message: error.response?.data?.error?.message || error.message || 'An error occurred',
        fields: error.response?.data?.error?.fields || {},
      },
    };

    return Promise.reject(formattedError);
  }
);

export default apiClient;
