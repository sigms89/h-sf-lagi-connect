import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/layouts/AppLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Upload from "@/pages/Upload";
import Analytics from "@/pages/Analytics";
import CategoryDetail from "@/pages/CategoryDetail";
import VendorView from "@/pages/VendorView";
import Benchmarking from "@/pages/Benchmarking";
import Marketplace from "@/pages/Marketplace";
import Settings from "@/pages/Settings";
import Onboarding from "@/pages/Onboarding";
import Admin from "@/pages/Admin";
import ProviderDashboard from "@/pages/ProviderDashboard";
import ProviderRegister from "@/pages/ProviderRegister";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2 * 60 * 1000, // 2 minutes default
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner richColors closeButton />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />

            {/* Onboarding — protected but outside AppLayout (full page wizard) */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            {/* Provider registration — protected but outside AppLayout */}
            <Route
              path="/provider/register"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProviderRegister />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Protected app routes — inside AppLayout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Transactions />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Upload />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Analytics />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            {/* NEW: Category drill-down page */}
            <Route
              path="/analytics/category/:categoryId"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CategoryDetail />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            {/* NEW: Vendor aggregation view */}
            <Route
              path="/analytics/vendors"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <VendorView />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/benchmarking"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Benchmarking />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketplace"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Marketplace />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin panel — protected, role check done inside Admin component */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Admin />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Provider dashboard */}
            <Route
              path="/provider"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProviderDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
