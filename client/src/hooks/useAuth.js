import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { queryKeys } from '@/lib/queryClient';
import { getTokens, clearTokens } from '@/lib/axios';

/**
 * Hook to get current user data
 */
export const useCurrentUser = () => {
    const { accessToken } = getTokens();

    return useQuery({
        queryKey: queryKeys.auth.currentUser,
        queryFn: authService.getCurrentUser,
        enabled: !!accessToken, // Only fetch if token exists
        retry: false, // Don't retry on auth failures
    });
};

/**
 * Hook to handle user login
 */
export const useLogin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.login,
        onSuccess: async () => {
            // Fetch user data after successful login
            await queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
        },
    });
};

/**
 * Hook to handle user registration
 */
export const useRegister = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.register,
        onSuccess: async () => {
            // Fetch user data after successful registration
            await queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
        },
    });
};

/**
 * Hook to handle Google login
 */
export const useGoogleLogin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.googleLogin,
        onSuccess: async () => {
            // Fetch user data after successful Google login
            await queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
        },
    });
};

/**
 * Hook to handle user logout
 */
export const useLogout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.logout,
        onSuccess: () => {
            // Clear all queries and cache
            queryClient.clear();
            clearTokens();
        },
    });
};

/**
 * Hook to update username
 */
export const useUpdateUsername = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.updateUsername,
        onSuccess: (data) => {
            // Update the user in cache
            queryClient.setQueryData(queryKeys.auth.currentUser, data);
        },
    });
};

/**
 * Hook to change password
 */
export const useChangePassword = () => {
    return useMutation({
        mutationFn: authService.changePassword,
    });
};

/**
 * Hook to upload avatar
 */
export const useUploadAvatar = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.uploadAvatar,
        onSuccess: async () => {
            // Refresh user data to get new avatar URL
            await queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
        },
    });
};

/**
 * Hook to delete avatar
 */
export const useDeleteAvatar = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.deleteAvatar,
        onSuccess: async () => {
            // Refresh user data to remove avatar URL
            await queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
        },
    });
};
