// ============================================================
// Húsfélagið.is: Admin Page (REPLACE)
// Super admin dashboard - protected, only for role_type = 'super_admin'
// Updated: added Notendur, Flokkar, Tilboðsferlar, Aðgerðaskrá tabs
// Tab order: Yfirlit, Húsfélög, Notendur, Þjónustuaðilar, Flokkar,
//            Tilboðsferlar, Flokkareglur, Tilkynningar, Aðgerðaskrá
// ============================================================

import {
  Shield,
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  Tag,
  FileText,
  Settings2,
  Bell,
  ScrollText,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid';
import { AssociationTable } from '@/components/admin/AssociationTable';
import { ProviderApproval } from '@/components/admin/ProviderApproval';
import { VendorRuleManager } from '@/components/admin/VendorRuleManager';
import { AdminNotifications } from '@/components/admin/AdminNotifications';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminCategoriesTab } from '@/components/admin/AdminCategoriesTab';
import { AdminBidRequestsTab } from '@/components/admin/AdminBidRequestsTab';
import { AdminAuditLog } from '@/components/admin/AdminAuditLog';
import { useAdminStats } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import type { Profile } from '@/types/database';

// ============================================================
// useCurrentProfile — get the full profile with role_type
// ============================================================
function useCurrentProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      const { data, error } = await db
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// Admin Page
// ============================================================

export default function Admin() {
  const { data: profile, isLoading: isLoadingProfile } = useCurrentProfile();
  const { data: stats, isLoading: isLoadingStats } = useAdminStats();

  // Loading state
  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-sm text-muted-foreground">Hleð...</div>
      </div>
    );
  }

  // 403 for non-admins
  if (!profile || profile.role_type !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Shield className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Aðgangur bannaður</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Þessari síðu er eingöngu ætlað fyrir kerfisstjóra Húsfélagið.is. Þú hefur ekki
            nauðsynleg réttindi.
          </p>
        </div>
        <div className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md">
          403 Forbidden
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Kerfisstjórnun</h1>
          <p className="text-xs text-muted-foreground">Stjórnborð Húsfélagið.is</p>
        </div>
        <Badge variant="outline" className="text-xs ml-2">Super Admin</Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          {/* 1. Yfirlit */}
          <TabsTrigger value="overview" className="gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Yfirlit
          </TabsTrigger>

          {/* 2. Húsfélög */}
          <TabsTrigger value="associations" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Húsfélög
          </TabsTrigger>

          {/* 3. Notendur */}
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Notendur
          </TabsTrigger>

          {/* 4. Þjónustuaðilar */}
          <TabsTrigger value="providers" className="gap-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            Þjónustuaðilar
            {(stats?.pendingProviders ?? 0) > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {stats!.pendingProviders}
              </Badge>
            )}
          </TabsTrigger>

          {/* 5. Flokkar */}
          <TabsTrigger value="categories" className="gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            Flokkar
          </TabsTrigger>

          {/* 6. Tilboðsferlar */}
          <TabsTrigger value="bidrequests" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Tilboðsferlar
          </TabsTrigger>

          {/* 7. Flokkareglur */}
          <TabsTrigger value="rules" className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            Flokkareglur
          </TabsTrigger>

          {/* 8. Tilkynningar */}
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Tilkynningar
          </TabsTrigger>

          {/* 9. Aðgerðaskrá */}
          <TabsTrigger value="auditlog" className="gap-1.5">
            <ScrollText className="h-3.5 w-3.5" />
            Aðgerðaskrá
          </TabsTrigger>
        </TabsList>

        {/* 1. Overview */}
        <TabsContent value="overview" className="mt-6">
          <AdminStatsGrid stats={stats} isLoading={isLoadingStats} />
        </TabsContent>

        {/* 2. Associations */}
        <TabsContent value="associations" className="mt-6">
          <AssociationTable />
        </TabsContent>

        {/* 3. Users */}
        <TabsContent value="users" className="mt-6">
          <AdminUsersTab />
        </TabsContent>

        {/* 4. Providers */}
        <TabsContent value="providers" className="mt-6">
          <ProviderApproval />
        </TabsContent>

        {/* 5. Categories */}
        <TabsContent value="categories" className="mt-6">
          <AdminCategoriesTab />
        </TabsContent>

        {/* 6. Bid Requests */}
        <TabsContent value="bidrequests" className="mt-6">
          <AdminBidRequestsTab />
        </TabsContent>

        {/* 7. Vendor rules */}
        <TabsContent value="rules" className="mt-6">
          <VendorRuleManager />
        </TabsContent>

        {/* 8. Notifications */}
        <TabsContent value="notifications" className="mt-6">
          <AdminNotifications />
        </TabsContent>

        {/* 9. Audit log */}
        <TabsContent value="auditlog" className="mt-6">
          <AdminAuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
