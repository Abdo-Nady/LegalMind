import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>; // You can replace with a proper loading component
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};
