import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import LandingPage from "@/components/pages/LandingPage";
import ChatPage from "@/components/pages/ChatPage";
import StatsPage from "@/components/pages/StatsPage";
import PWAInstallPrompt from "@/components/ui/PWAInstallPrompt";
import { registerServiceWorker } from "@/utils/pwaUtils";

const queryClient = new QueryClient();

const App = () => {
  const [activeTab, setActiveTab] = useState<"home" | "chat" | "stats">("home");

  useEffect(() => {
    registerServiceWorker();
  }, []);

  const renderCurrentPage = () => {
    switch (activeTab) {
      case "home":
        return <LandingPage onNavigateToChat={() => setActiveTab("chat")} />;
      case "chat":
        return <ChatPage />;
      case "stats":
        return <StatsPage />;
      default:
        return <LandingPage onNavigateToChat={() => setActiveTab("chat")} />;
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
