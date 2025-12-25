import axiosInstance, { saveTokens, clearTokens } from '@/lib/axios';
import { AUTH_ENDPOINTS } from '@/lib/api-endpoints';

/**
 * Auth API Service
 * All authentication-related API calls using axios
 */
export const authService = {
    /**
     * Register a new user
     */
    register: async ({ username, email, password1, password2 }) => {
        const response = await axiosInstance.post(AUTH_ENDPOINTS.REGISTER, {
            username,
            email,
            password1,
            password2,
        });

        // Save tokens if provided
        if (response.data.access && response.data.refresh) {
            saveTokens(response.data.access, response.data.refresh);
        }

        return response.data;
    },

    /**
     * Login user
     */
    login: async ({ email, password }) => {
        const response = await axiosInstance.post(AUTH_ENDPOINTS.LOGIN, {
            email,
            password,
        });

        // Save tokens if provided
        if (response.data.access && response.data.refresh) {
            saveTokens(response.data.access, response.data.refresh);
        }

        return response.data;
    },

    /**
     * Google OAuth login
     */
    googleLogin: async (idToken) => {
        const response = await axiosInstance.post(AUTH_ENDPOINTS.GOOGLE_LOGIN, {
            access_token: idToken, // Backend expects access_token field
        });

        // Save tokens if provided
        if (response.data.access && response.data.refresh) {
            saveTokens(response.data.access, response.data.refresh);
        }

        return response.data;
    },

    /**
     * Logout user
     */
    logout: async () => {
        try {
            await axiosInstance.post(AUTH_ENDPOINTS.LOGOUT);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearTokens();
        }
    },

    /**
     * Get current user profile
     */
    getCurrentUser: async () => {
        const response = await axiosInstance.get(AUTH_ENDPOINTS.ME);
        return response.data;
    },

    /**
     * Update username
     */
    updateUsername: async (username) => {
        const response = await axiosInstance.patch(AUTH_ENDPOINTS.ME, {
            username,
        });
        return response.data;
    },

    /**
     * Change password
     */
    changePassword: async ({ oldPassword, newPassword1, newPassword2 }) => {
        const response = await axiosInstance.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
            old_password: oldPassword,
            new_password1: newPassword1,
            new_password2: newPassword2,
        });
        return response.data;
    },

    /**
     * Upload avatar
     */
    uploadAvatar: async (file) => {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await axiosInstance.post(
            AUTH_ENDPOINTS.AVATAR_UPLOAD,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    },

    /**
     * Delete avatar
     */
    deleteAvatar: async () => {
        const response = await axiosInstance.delete(AUTH_ENDPOINTS.AVATAR_DELETE);
        return response.data;
    },
};
