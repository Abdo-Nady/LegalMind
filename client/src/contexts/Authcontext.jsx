import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, getTokens } from '@/services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);

    // Check if user is authenticated on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { accessToken } = getTokens();
        const guestFlag = localStorage.getItem('isGuest');

        if (guestFlag === 'true') {
            setIsGuest(true);
            setLoading(false);
            return;
        }

        if (!accessToken) {
            setLoading(false);
            return;
        }

        try {
            const userData = await authAPI.getCurrentUser();
            setUser(userData);
            setIsGuest(false);
        } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
            setIsGuest(false);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const data = await authAPI.login(email, password);
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
        setIsGuest(false);
        localStorage.removeItem('isGuest');
        return data;
    };

    const register = async (username, email, password1, password2) => {
        const data = await authAPI.register(username, email, password1, password2);
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
        setIsGuest(false);
        localStorage.removeItem('isGuest');
        return data;
    };

    const googleLogin = async (token) => {
        const data = await authAPI.googleLogin(token);
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
        setIsGuest(false);
        localStorage.removeItem('isGuest');
        return data;
    };

    const setGuestMode = () => {
        setIsGuest(true);
        setUser(null);
        localStorage.setItem('isGuest', 'true');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    };

    const logout = async () => {
        if (isGuest) {
            setIsGuest(false);
            localStorage.removeItem('isGuest');
            return;
        }
        await authAPI.logout();
        setUser(null);
        setIsGuest(false);
        localStorage.removeItem('isGuest');
    };

    // Add function to refresh user data
    const refreshUser = async () => {
        if (isGuest) return;
        const { accessToken } = getTokens();
        if (!accessToken) return;

        try {
            const userData = await authAPI.getCurrentUser();
            setUser(userData);
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        googleLogin,
        logout,
        isGuest,
        setGuestMode,
        refreshUser, // Add this
        isAuthenticated: !!user || isGuest,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};