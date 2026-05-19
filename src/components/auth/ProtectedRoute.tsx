import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { session, loading } = useAuth();

    if (loading) {
        return null; // AuthProvider handles naming loading state visually
    }

    if (!session) {
        return <Navigate to="/admin/login" replace />;
    }

    return <>{children}</>;
};
