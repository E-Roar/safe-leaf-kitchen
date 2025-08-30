import { useState, useEffect, useCallback, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import LandingPage from "@/components/pages/LandingPage";
import ChatPage from "@/components/pages/ChatPage";
import StatsPage from "@/components/pages/StatsPage";
import RecipePage from "@/components/pages/RecipePage";
import LeavesPage from "@/components/pages/LeavesPage";
import PWAInstallPrompt from "@/components/ui/PWAInstallPrompt";
import { registerServiceWorker } from "@/utils/pwaUtils";
import { safeStorage } from "@/lib/safeStorage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { logger } from "@/lib/logger";
import { VisualEffectsProvider } from "@/contexts/VisualEffectsContext";
import { RemoteErrorLogger } from "@/utils/remoteErrorLogger";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [activeTab, setActiveTab] = useState<"home" | "chat" | "stats" | "recipes" | "leaves" | "settings">("home");
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [selectedLeafId, setSelectedLeafId] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = safeStorage.get('theme') as 'light' | 'dark';
    return savedTheme === 'dark' ? 'dark' : 'light';
  });

  // Memoized callbacks to prevent unnecessary re-renders
  const handleToggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleNavigateToRecipe = useCallback((event: CustomEvent) => {
    setSelectedRecipeId(event.detail.recipeId);
    setActiveTab("recipes");
  }, []);

  const handleNavigateToLeaf = useCallback((event: CustomEvent) => {
    setSelectedLeafId(event.detail.leafId);
    setActiveTab("leaves");
  }, []);

  const handleNavigateToChat = useCallback(() => {
    setActiveTab("chat");
  }, []);

  const handleNavigateToRecipes = useCallback(() => {
    setActiveTab("recipes");
  }, []);

  const handleNavigateToLeaves = useCallback(() => {
    setActiveTab("leaves");
  }, []);

  const handleNavigateToSettings = useCallback(() => {
    setActiveTab("settings");
  }, []);

  const handleNavigateToScan = useCallback(() => {
    setActiveTab("chat");
    // Defer event to ensure ChatPage is mounted
    const timeoutId = setTimeout(() => {
      window.dispatchEvent(new Event('openCameraScan'));
    }, 0);
    
    // Cleanup timeout if component unmounts
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    // Initialize remote error logger first
    RemoteErrorLogger.initialize();
    RemoteErrorLogger.log('info', 'App initialized', {
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
    
    if (!safeStorage.set('theme', theme)) {
      logger.warn('Failed to save theme preference to localStorage');
    }
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

  // Memoized page rendering to prevent unnecessary re-renders
  const renderCurrentPage = useMemo(() => {
    switch (activeTab) {
      case "home":
        return (
          <LandingPage
            onNavigateToChat={handleNavigateToChat}
            onNavigateToRecipes={handleNavigateToRecipes}
            onNavigateToLeaves={handleNavigateToLeaves}
            onToggleTheme={handleToggleTheme}
            onNavigateToScan={handleNavigateToScan}
          />
        );
      case "chat":
        return <ChatPage />;
      case "stats":
        return <StatsPage />;
      case "recipes":
        return <RecipePage selectedRecipeId={selectedRecipeId} />;
      case "leaves":
        return <LeavesPage selectedLeafId={selectedLeafId} />;
      case "settings":
        return <div></div>; // Settings are now handled in the password-protected AppLayout
      default:
        return (
          <LandingPage
            onNavigateToChat={handleNavigateToChat}
            onNavigateToRecipes={handleNavigateToRecipes}
            onNavigateToLeaves={handleNavigateToLeaves}
            onToggleTheme={handleToggleTheme}
            onNavigateToScan={handleNavigateToScan}
          />
        );
    }
  }, [activeTab, selectedRecipeId, selectedLeafId, handleNavigateToChat, handleNavigateToRecipes, handleNavigateToLeaves, handleToggleTheme, handleNavigateToScan]);

  return (
    <ErrorBoundary>
      <VisualEffectsProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
              {renderCurrentPage}
            </AppLayout>
            <PWAInstallPrompt />
          </TooltipProvider>
        </QueryClientProvider>
      </VisualEffectsProvider>
    </ErrorBoundary>
  );
};

export default App;
