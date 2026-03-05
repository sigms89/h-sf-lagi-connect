// ============================================================
// Húsfélagið.is — ProtectedRoute
// Allows /provider and /provider/register without association
// Supports optional requiredRole prop for route-level role guarding
// ============================================================

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentAssociation } from "@/hooks/useAssociation";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/db";

// Routes that do NOT require an association membership
const ASSOCIATION_EXEMPT_ROUTES = ["/onboarding", "/provider", "/provider/register"];

type UserRole = 'super_admin' | 'admin' | 'board' | 'member' | 'service_provider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { session, loading, user } = useAuth();
  const { data: association, isLoading: assocLoading } = useCurrentAssociation();
  const location = useLocation();

  // Role query — only if requiredRole is specified
  const { data: roleData, isLoading: roleLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      // Check if super_admin by looking at profiles or DevRoleSwitcher pattern
      // The app uses `role_type` from profiles for super_admin
      const { data: profile } = await db
        .from('profiles')
        .select('role_type')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.role_type === 'super_admin') return 'super_admin';

      // Check if service_provider
      const { data: provider } = await db
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (provider) return 'service_provider';

      // Check association role
      const { data: membership } = await db
        .from('association_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      return (membership?.role as UserRole) ?? 'member';
    },
    enabled: !!user && !!requiredRole,
    staleTime: 5 * 60 * 1000,
  });

  const isRoleLoading = !!requiredRole && roleLoading;

  if (loading || assocLoading || isRoleLoading) {
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

  // If requiredRole is specified, check role
  if (requiredRole && !roleLoading && roleData) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    // super_admin always has access
    if (roleData !== 'super_admin' && !allowed.includes(roleData as UserRole)) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">Aðgangur bannaður</p>
            <p className="text-sm text-muted-foreground">Þú hefur ekki réttindi til að skoða þessa síðu.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
