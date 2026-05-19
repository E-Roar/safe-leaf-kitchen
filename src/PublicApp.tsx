import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PWAInstallPrompt from "@/components/ui/PWAInstallPrompt";
import { registerServiceWorker } from "@/utils/pwaUtils";
import { safeStorage } from "@/lib/safeStorage";
import { logger } from "@/lib/logger";
import { RemoteErrorLogger } from "@/utils/remoteErrorLogger";

export const PublicApp = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const activeTab = location.pathname === "/" ? "home" : location.pathname.slice(1).split("/")[0] || "home";

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const savedTheme = safeStorage.get('theme') as 'light' | 'dark';
        return savedTheme === 'dark' ? 'dark' : 'light';
    });

    const handleToggleTheme = useCallback(() => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const handleNavigateToRecipe = useCallback((event: CustomEvent) => {
        const recipeId = event.detail.recipeId;
        navigate(`/recipes${recipeId ? `?recipeId=${recipeId}` : ''}`);
    }, [navigate]);

    const handleNavigateToLeaf = useCallback((event: CustomEvent) => {
        const leafId = event.detail.leafId;
        navigate(`/leaves${leafId ? `?leafId=${leafId}` : ''}`);
    }, [navigate]);

    useEffect(() => {
        RemoteErrorLogger.initialize();
        RemoteErrorLogger.log('info', 'PublicApp initialized', {
            activeTab,
            theme,
            timestamp: new Date().toISOString()
        });

        registerServiceWorker().catch(error => {
            logger.error('Failed to register service worker', error);
            RemoteErrorLogger.log('error', 'Service worker registration failed', error);
        });
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        safeStorage.set('theme', theme);
    }, [theme]);

    useEffect(() => {
        window.addEventListener('toggleTheme', handleToggleTheme as EventListener);
        return () => window.removeEventListener('toggleTheme', handleToggleTheme as EventListener);
    }, [handleToggleTheme]);

    useEffect(() => {
        window.addEventListener('navigateToRecipe', handleNavigateToRecipe as EventListener);
        window.addEventListener('navigateToLeaf', handleNavigateToLeaf as EventListener);
        return () => {
            window.removeEventListener('navigateToRecipe', handleNavigateToRecipe as EventListener);
            window.removeEventListener('navigateToLeaf', handleNavigateToLeaf as EventListener);
        };
    }, [handleNavigateToRecipe, handleNavigateToLeaf]);

    const handleTabChange = (tab: string) => {
        if (tab === 'home') {
            navigate('/');
        } else {
            navigate(`/${tab}`);
        }
    };

    return (
        <>
            <AppLayout activeTab={activeTab as any} onTabChange={handleTabChange}>
                <Outlet />
            </AppLayout>
            <PWAInstallPrompt />
        </>
    );
};
