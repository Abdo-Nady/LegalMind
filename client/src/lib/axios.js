import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 second timeout
});

// Token management helpers
const getTokens = () => {
    return {
        accessToken: localStorage.getItem('access_token'),
        refreshToken: localStorage.getItem('refresh_token'),
    };
};

const saveTokens = (accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem('access_token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
};

const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

// Track if we're currently refreshing to prevent multiple refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Request interceptor - Add auth token to requests
axiosInstance.interceptors.request.use(
    (config) => {
        const { accessToken } = getTokens();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle token refresh
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If error is not 401 or request already retried, reject
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // If we're already refreshing, queue this request
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return axiosInstance(originalRequest);
                })
                .catch(err => {
                    return Promise.reject(err);
                });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const { refreshToken } = getTokens();

        if (!refreshToken) {
            clearTokens();
            isRefreshing = false;
            return Promise.reject(error);
        }

        try {
            // Attempt to refresh token
            const response = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
                refresh: refreshToken,
            });

            const { access } = response.data;
            saveTokens(access, refreshToken);

            // Update authorization header
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access}`;
            originalRequest.headers.Authorization = `Bearer ${access}`;

            processQueue(null, access);
            isRefreshing = false;

            // Retry original request
            return axiosInstance(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            clearTokens();
            isRefreshing = false;

            // Redirect to login or handle as needed
            window.location.href = '/login';
            return Promise.reject(refreshError);
        }
    }
);

export { axiosInstance, getTokens, saveTokens, clearTokens };
export default axiosInstance;
