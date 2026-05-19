import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { session, loading } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        if (!session?.user?.id) {
            setIsAdmin(false);
            return;
        }
        (async () => {
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .maybeSingle();
            setIsAdmin(data?.role === 'admin');
        })();
    }, [session]);

    if (loading || isAdmin === null) {
        return null;
    }

    if (!session) {
        return <Navigate to="/" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
