const API_BASE_URL = 'http://localhost:8000/api'; // Django backend URL

// Get stored tokens
const getTokens = () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    return { accessToken, refreshToken };
};

// Save tokens
const saveTokens = (accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem('access_token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
};

// Clear tokens
const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

// API request with automatic token refresh
const apiRequest = async (endpoint, options = {}) => {
    const { accessToken } = getTokens();

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            ...options.headers,
        },
    };

    let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // If token expired, try to refresh
    if (response.status === 401 && accessToken) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            // Retry original request with new token
            config.headers.Authorization = `Bearer ${getTokens().accessToken}`;
            response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        }
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.error || 'Request failed');
    }

    return response.json();
};

// Refresh access token
const refreshAccessToken = async () => {
    const { refreshToken } = getTokens();
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/accounts/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            saveTokens(data.access, refreshToken);
            return true;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
    }

    clearTokens();
    return false;
};


// Auth API functions
export const authAPI = {
    // Register
    register: async (username, email, password1, password2) => {
        try {
            const response = await fetch(`${API_BASE_URL}/accounts/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password1, password2 }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(JSON.stringify(error));
            }

            const data = await response.json();
            if (data.access && data.refresh) {
                saveTokens(data.access, data.refresh);
            }
            return data;
        } catch (error) {
            // Handle network errors
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error('Cannot connect to server');
            }
            throw error;
        }
    },

    // Login
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/accounts/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(JSON.stringify(error));
            }

            const data = await response.json();
            if (data.access && data.refresh) {
                saveTokens(data.access, data.refresh);
            }
            return data;
        } catch (error) {
            // Handle network errors
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error('Cannot connect to server. Make sure the backend is running');
            }
            throw error;
        }
    },

    // Logout
    logout: async () => {
        try {
            await apiRequest('/accounts/logout/', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearTokens();
        }
    },

    // Get current user
    getCurrentUser: async () => {
        return apiRequest('/accounts/me/');
    },

    // Google OAuth - Updated to handle ID token
    googleLogin: async (idToken) => {
        try {
            const response = await fetch(`${API_BASE_URL}/accounts/google/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: idToken }), // Backend expects access_token field
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(JSON.stringify(error));
            }

            const data = await response.json();
            if (data.access && data.refresh) {
                saveTokens(data.access, data.refresh);
            }
            return data;
        } catch (error) {
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error('Cannot connect to server. Make sure the backend is running');
            }
            throw error;
        }
    },

    // Upload Avatar
    uploadAvatar: async (file) => {
        const { accessToken } = getTokens();
        if (!accessToken) {
            throw new Error('Not authenticated');
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch(`${API_BASE_URL}/accounts/profile/avatar/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    // Don't set Content-Type, let browser set it with boundary
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(JSON.stringify(error));
            }

            return response.json();
        } catch (error) {
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error('Cannot connect to server. Make sure the backend is running');
            }
            throw error;
        }
    },

    // Delete Avatar
    deleteAvatar: async () => {
        const { accessToken } = getTokens();
        if (!accessToken) {
            throw new Error('Not authenticated');
        }

        try {
            const response = await fetch(`${API_BASE_URL}/accounts/profile/avatar/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(JSON.stringify(error));
            }

            return response.json();
        } catch (error) {
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error('Cannot connect to server. Make sure the backend is running');
            }
            throw error;
        }
    },

    // Change Password
    changePassword: async (oldPassword, newPassword1, newPassword2) => {
        try {
            const response = await fetch(`${API_BASE_URL}/accounts/password/change/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getTokens().accessToken}`,
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password1: newPassword1,
                    new_password2: newPassword2,
                }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(JSON.stringify(error));
            }

            return response.json();
        } catch (error) {
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error('Cannot connect to server. Make sure the backend is running');
            }
            throw error;
        }
    },

    // Update Username
    updateUsername: async (username) => {
        try {
            const { accessToken } = getTokens();
            if (!accessToken) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_BASE_URL}/accounts/me/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ username }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(JSON.stringify(error));
            }

            return response.json();
        } catch (error) {
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error('Cannot connect to server. Make sure the backend is running');
            }
            throw error;
        }
    },
};

// Generic API request (for other endpoints)
export { apiRequest, getTokens, clearTokens };
