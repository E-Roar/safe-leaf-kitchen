import { Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { VisualEffectsProvider } from "@/contexts/VisualEffectsContext";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages & Components
import { PublicApp } from "@/PublicApp";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { AdminRoute } from "@/components/auth/AdminRoute";

// Public Pages
import LandingPage from "@/components/pages/LandingPage";
import ChatPage from "@/components/pages/ChatPage";
import StatsPage from "@/components/pages/StatsPage";
import RecipePage from "@/components/pages/RecipePage";
import LeavesPage from "@/components/pages/LeavesPage";
import SettingsPage from "@/components/pages/SettingsPage";
import ProfilePage from "@/components/pages/ProfilePage";

// Admin Tools
import { DataMigration } from "@/components/admin/DataMigration";
import { ManageLeaves } from "@/components/admin/ManageLeaves";
import { ManageRecipes } from "@/components/admin/ManageRecipes";
import { KnowledgeBase } from "@/components/rag/KnowledgeBase";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { DashboardOverview } from "@/components/admin/DashboardOverview";
import KnowledgeGraphView from "@/components/admin/KnowledgeGraphView";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <HelmetProvider>
    <ErrorBoundary>
      <VisualEffectsProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />

              <Routes>
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardOverview />} />
                  <Route path="leaves" element={<ManageLeaves />} />
                  <Route path="recipes" element={<ManageRecipes />} />
                  <Route path="knowledge" element={<KnowledgeBase />} />
                  <Route path="knowledge-graph" element={<KnowledgeGraphView />} />
                  <Route path="migration" element={<DataMigration />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* Public App - uses url-based routing for tab persistence */}
                <Route element={<PublicApp />}>
                  <Route index element={<LandingPage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="stats" element={<StatsPage />} />
                  <Route path="recipes" element={<RecipePage />} />
                  <Route path="leaves" element={<LeavesPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </VisualEffectsProvider>
    </ErrorBoundary>
    </HelmetProvider>
  );
};

export default App;
