// ============================================================
// Húsfélagið.is: App Root with Routes (v4: simplified nav)
// ============================================================

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/layouts/AppLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Peningar from "@/pages/Peningar";
import Verkefni from "@/pages/Verkefni";
import Skjol from "@/pages/Skjol";
import Upload from "@/pages/Upload";
import Benchmarking from "@/pages/Benchmarking";
import Marketplace from "@/pages/Marketplace";
import Settings from "@/pages/Settings";
import Onboarding from "@/pages/Onboarding";
import Admin from "@/pages/Admin";
import ProviderDashboard from "@/pages/ProviderDashboard";
import ProviderRequests from "@/pages/ProviderRequests";
import ProviderBidsPage from "@/pages/ProviderBidsPage";
import ProviderProfilePage from "@/pages/ProviderProfilePage";
import ProviderRegister from "@/pages/ProviderRegister";
import ProviderPublicProfile from "@/components/marketplace/ProviderPublicProfile";
import { VendorDetailPage } from "@/pages/VendorDetailPage";
import TaskDetailPage from "@/pages/TaskDetailPage";
import ReportsPage from "@/pages/ReportsPage";
import NotFound from "@/pages/NotFound";
import ResetPassword from "@/pages/ResetPassword";
import LandingPage from "@/pages/LandingPage";
import WelcomeNewChairman from "@/pages/WelcomeNewChairman";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2 * 60 * 1000,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner richColors closeButton />
        <BrowserRouter>
          <TimeRangeProvider>
            <AuthProvider>
              <Routes>
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/provider/register" element={<ProtectedRoute><AppLayout><ProviderRegister /></AppLayout></ProtectedRoute>} />

                {/* Primary destinations — 4 items */}
                <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
                <Route path="/peningar" element={<ProtectedRoute><AppLayout><Peningar /></AppLayout></ProtectedRoute>} />
                <Route path="/verkefni" element={<ProtectedRoute><AppLayout><Verkefni /></AppLayout></ProtectedRoute>} />
                <Route path="/skjol" element={<ProtectedRoute><AppLayout><Skjol /></AppLayout></ProtectedRoute>} />

                {/* Hidden but reachable: benchmarking, marketplace, admin, provider */}
                <Route path="/benchmarking" element={<ProtectedRoute><AppLayout><Benchmarking /></AppLayout></ProtectedRoute>} />
                <Route path="/marketplace" element={<ProtectedRoute><AppLayout><Marketplace /></AppLayout></ProtectedRoute>} />
                <Route path="/marketplace/provider/:providerId" element={<ProtectedRoute><AppLayout><ProviderPublicProfile /></AppLayout></ProtectedRoute>} />
                <Route path="/provider" element={<ProtectedRoute><AppLayout><ProviderDashboard /></AppLayout></ProtectedRoute>} />
                <Route path="/provider/requests" element={<ProtectedRoute><AppLayout><ProviderRequests /></AppLayout></ProtectedRoute>} />
                <Route path="/provider/bids" element={<ProtectedRoute><AppLayout><ProviderBidsPage /></AppLayout></ProtectedRoute>} />
                <Route path="/provider/profile" element={<ProtectedRoute><AppLayout><ProviderProfilePage /></AppLayout></ProtectedRoute>} />

                {/* Report (Sækja skýrslu) */}
                <Route path="/skyrsla" element={<ProtectedRoute><AppLayout><ReportsPage /></AppLayout></ProtectedRoute>} />

                {/* Legacy redirects → simplified pages */}
                <Route path="/financials" element={<Navigate to="/peningar" replace />} />
                <Route path="/transactions" element={<Navigate to="/peningar" replace />} />
                <Route path="/classification" element={<Navigate to="/peningar" replace />} />
                <Route path="/analytics" element={<Navigate to="/peningar" replace />} />
                <Route path="/alerts" element={<Navigate to="/peningar" replace />} />
                <Route path="/reports" element={<Navigate to="/skyrsla" replace />} />
                <Route path="/min-verkefni" element={<Navigate to="/verkefni" replace />} />

                {/* System pages */}
                <Route path="/upload" element={<ProtectedRoute><AppLayout><Upload /></AppLayout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AppLayout><Admin /></AppLayout></ProtectedRoute>} />
                <Route path="/vendors/:vendorName" element={<ProtectedRoute><AppLayout><VendorDetailPage /></AppLayout></ProtectedRoute>} />
                <Route path="/tasks/:taskId" element={<ProtectedRoute><AppLayout><TaskDetailPage /></AppLayout></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </TimeRangeProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
