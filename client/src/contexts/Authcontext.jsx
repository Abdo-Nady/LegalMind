import { createContext, useContext, useState } from 'react';
import {
    useCurrentUser,
    useLogin as useLoginMutation,
    useRegister as useRegisterMutation,
    useGoogleLogin as useGoogleLoginMutation,
    useLogout as useLogoutMutation,
} from '@/hooks/useAuth';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [isGuest, setIsGuest] = useState(() => {
        return localStorage.getItem('isGuest') === 'true';
    });

    // React Query hooks
    const { data: user, isLoading: loading, refetch: refreshUser } = useCurrentUser();
    const loginMutation = useLoginMutation();
    const registerMutation = useRegisterMutation();
    const googleLoginMutation = useGoogleLoginMutation();
    const logoutMutation = useLogoutMutation();

    // Login handler
    const login = async (email, password) => {
        await loginMutation.mutateAsync({ email, password });
        localStorage.removeItem('isGuest');
        setIsGuest(false);
    };

    // Register handler
    const register = async (username, email, password1, password2) => {
        await registerMutation.mutateAsync({ username, email, password1, password2 });
        localStorage.removeItem('isGuest');
        setIsGuest(false);
    };

    // Google login handler
    const googleLogin = async (token) => {
        await googleLoginMutation.mutateAsync(token);
        localStorage.removeItem('isGuest');
        setIsGuest(false);
    };

    // Guest mode handler
    const setGuestMode = () => {
        setIsGuest(true);
        localStorage.setItem('isGuest', 'true');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    };

    // Logout handler
    const logout = async () => {
        if (isGuest) {
            setIsGuest(false);
            localStorage.removeItem('isGuest');
            return;
        }
        await logoutMutation.mutateAsync();
        setIsGuest(false);
        localStorage.removeItem('isGuest');
    };

    const value = {
        user: user || null,
        loading,
        login,
        register,
        googleLogin,
        logout,
        isGuest,
        setGuestMode,
        refreshUser,
        isAuthenticated: !!user || isGuest,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};