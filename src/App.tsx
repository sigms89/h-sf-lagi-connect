// ============================================================
// Húsfélagið.is — App Root with Routes (v2: restructured nav)
// ============================================================

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/layouts/AppLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Financials from "@/pages/Financials";
import Upload from "@/pages/Upload";
import Benchmarking from "@/pages/Benchmarking";
import Marketplace from "@/pages/Marketplace";
import Settings from "@/pages/Settings";
import Onboarding from "@/pages/Onboarding";
import Admin from "@/pages/Admin";
import ProviderDashboard from "@/pages/ProviderDashboard";
import ProviderRegister from "@/pages/ProviderRegister";
import { VendorDetailPage } from "@/pages/VendorDetailPage";
import TaskDetailPage from "@/pages/TaskDetailPage";
import MinVerkefni from "@/pages/MinVerkefni";
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

            {/* Primary destinations */}
            <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/financials" element={<ProtectedRoute><AppLayout><Financials /></AppLayout></ProtectedRoute>} />
            <Route path="/benchmarking" element={<ProtectedRoute><AppLayout><Benchmarking /></AppLayout></ProtectedRoute>} />
            <Route path="/marketplace" element={<ProtectedRoute><AppLayout><Marketplace /></AppLayout></ProtectedRoute>} />

            {/* Legacy redirects → /financials with correct tab */}
            <Route path="/transactions" element={<Navigate to="/financials?tab=faerslur" replace />} />
            <Route path="/classification" element={<Navigate to="/financials?tab=flokkun" replace />} />
            <Route path="/analytics" element={<Navigate to="/financials?tab=greining" replace />} />
            <Route path="/alerts" element={<Navigate to="/financials?tab=faerslur" replace />} />
            <Route path="/reports" element={<Navigate to="/financials?tab=skyrsla" replace />} />

            {/* System pages */}
            <Route path="/upload" element={<ProtectedRoute><AppLayout><Upload /></AppLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AppLayout><Admin /></AppLayout></ProtectedRoute>} />
            <Route path="/provider" element={<ProtectedRoute><AppLayout><ProviderDashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/vendors/:vendorName" element={<ProtectedRoute><AppLayout><VendorDetailPage /></AppLayout></ProtectedRoute>} />
            <Route path="/tasks/:taskId" element={<ProtectedRoute><AppLayout><TaskDetailPage /></AppLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
        </TimeRangeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
