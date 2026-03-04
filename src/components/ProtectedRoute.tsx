// ============================================================
// Húsfélagið.is — ProtectedRoute
// Allows /provider and /provider/register without association
// ============================================================

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentAssociation } from "@/hooks/useAssociation";

// Routes that do NOT require an association membership
const ASSOCIATION_EXEMPT_ROUTES = ["/onboarding", "/provider", "/provider/register"];

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const { data: association, isLoading: assocLoading } = useCurrentAssociation();
  const location = useLocation();

  if (loading || assocLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Hleð...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Check if the current path is exempt from association requirement
  const isExempt = ASSOCIATION_EXEMPT_ROUTES.some(
    (route) => location.pathname === route || location.pathname.startsWith(route + "/")
  );

  // Redirect to onboarding if user has no association AND is not on an exempt route
  if (!association && !isExempt) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
