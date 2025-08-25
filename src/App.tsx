import { useState, useEffect } from "react";
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

const queryClient = new QueryClient();

const App = () => {
  const [activeTab, setActiveTab] = useState<"home" | "chat" | "stats" | "recipes" | "leaves">("home");
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [selectedLeafId, setSelectedLeafId] = useState<number | null>(null);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    const handleNavigateToRecipe = (event: CustomEvent) => {
      setSelectedRecipeId(event.detail.recipeId);
      setActiveTab("recipes");
    };
    const handleNavigateToLeaf = (event: CustomEvent) => {
      setSelectedLeafId(event.detail.leafId);
      setActiveTab("leaves");
    };

    window.addEventListener('navigateToRecipe', handleNavigateToRecipe as EventListener);
    window.addEventListener('navigateToLeaf', handleNavigateToLeaf as EventListener);
    return () => {
      window.removeEventListener('navigateToRecipe', handleNavigateToRecipe as EventListener);
      window.removeEventListener('navigateToLeaf', handleNavigateToLeaf as EventListener);
    };
  }, []);

  const renderCurrentPage = () => {
    switch (activeTab) {
      case "home":
        return (
          <LandingPage
            onNavigateToChat={() => setActiveTab("chat")}
            onNavigateToRecipes={() => setActiveTab("recipes")}
            onNavigateToScan={() => {
              setActiveTab("chat");
              // Defer event to ensure ChatPage is mounted
              setTimeout(() => {
                window.dispatchEvent(new Event('openCameraScan'));
              }, 0);
            }}
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
      default:
        return (
          <LandingPage
            onNavigateToChat={() => setActiveTab("chat")}
            onNavigateToRecipes={() => setActiveTab("recipes")}
            onNavigateToScan={() => {
              setActiveTab("chat");
              setTimeout(() => {
                window.dispatchEvent(new Event('openCameraScan'));
              }, 0);
            }}
          />
        );
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
          {renderCurrentPage()}
        </AppLayout>
        <PWAInstallPrompt />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
