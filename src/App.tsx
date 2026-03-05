// ============================================================
// Húsfélagið.is — App Root with Routes (Updated: Fasi 4)
// ============================================================

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/layouts/AppLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Upload from "@/pages/Upload";
import Analytics from "@/pages/Analytics";
import Benchmarking from "@/pages/Benchmarking";
import Marketplace from "@/pages/Marketplace";
import Settings from "@/pages/Settings";
import Onboarding from "@/pages/Onboarding";
import Admin from "@/pages/Admin";
import ProviderDashboard from "@/pages/ProviderDashboard";
import ProviderRegister from "@/pages/ProviderRegister";
import ClassificationPage from "@/pages/ClassificationPage";
import AlertsPage from "@/pages/AlertsPage";
import ReportsPage from "@/pages/ReportsPage";
import { VendorDetailPage } from "@/pages/VendorDetailPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2 * 60 * 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner richColors closeButton />
      <BrowserRouter>
        <TimeRangeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/provider/register" element={<ProtectedRoute><AppLayout><ProviderRegister /></AppLayout></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><AppLayout><Transactions /></AppLayout></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><AppLayout><Upload /></AppLayout></ProtectedRoute>} />
            <Route path="/classification" element={<ProtectedRoute><AppLayout><ClassificationPage /></AppLayout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AppLayout><Analytics /></AppLayout></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><AppLayout><AlertsPage /></AppLayout></ProtectedRoute>} />
            <Route path="/benchmarking" element={<ProtectedRoute><AppLayout><Benchmarking /></AppLayout></ProtectedRoute>} />
            <Route path="/marketplace" element={<ProtectedRoute><AppLayout><Marketplace /></AppLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AppLayout><Admin /></AppLayout></ProtectedRoute>} />
            <Route path="/provider" element={<ProtectedRoute><AppLayout><ProviderDashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><AppLayout><ReportsPage /></AppLayout></ProtectedRoute>} />
            <Route path="/vendors/:vendorName" element={<ProtectedRoute><AppLayout><VendorDetailPage /></AppLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
        </TimeRangeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
