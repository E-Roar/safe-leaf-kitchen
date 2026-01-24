import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { VisualEffectsProvider } from "@/contexts/VisualEffectsContext";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages & Components
import { PublicApp } from "@/PublicApp";
import { LoginPage } from "@/components/auth/LoginPage";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Admin Tools
import { DataMigration } from "@/components/admin/DataMigration";
import { ManageLeaves } from "@/components/admin/ManageLeaves";
import { ManageRecipes } from "@/components/admin/ManageRecipes";
import { KnowledgeBase } from "@/components/rag/KnowledgeBase";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { DashboardOverview } from "@/components/admin/DashboardOverview";

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
    <ErrorBoundary>
      <VisualEffectsProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />

              <Routes>
                {/* Admin Routes */}
                <Route path="/admin/login" element={<LoginPage />} />

                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardOverview />} />
                  <Route path="leaves" element={<ManageLeaves />} />
                  <Route path="recipes" element={<ManageRecipes />} />
                  <Route path="knowledge" element={<KnowledgeBase />} />
                  <Route path="migration" element={<DataMigration />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* Public App (Catch-all) */}
                <Route path="*" element={<PublicApp />} />
              </Routes>

            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </VisualEffectsProvider>
    </ErrorBoundary>
  );
};

export default App;
