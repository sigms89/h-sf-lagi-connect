import {
  LayoutDashboard,
  Receipt,
  Upload,
  BarChart3,
  Scale,
  Store,
  Settings,
  Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCurrentAssociation } from "@/hooks/useAssociation";
import { Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/db";
import type { Profile } from "@/types/database";

// ============================================================
// NAV ITEMS
// ============================================================
const mainItems = [
  { title: "Yfirlit", url: "/", icon: LayoutDashboard },
  { title: "Færslur", url: "/transactions", icon: Receipt },
  { title: "Hlaða upp", url: "/upload", icon: Upload },
  { title: "Greining", url: "/analytics", icon: BarChart3 },
];

const insightItems = [
  { title: "Samanburður", url: "/benchmarking", icon: Scale },
  { title: "Markaðstorg", url: "/marketplace", icon: Store },
];

const bottomItems = [
  { title: "Stillingar", url: "/settings", icon: Settings },
];

// ============================================================
// COMPONENT
// ============================================================
export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { data: association } = useCurrentAssociation();
  const { user } = useAuth();

  // Check if current user is super_admin
  const { data: profile } = useQuery({
    queryKey: ["profile-sidebar", user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      const { data, error } = await db
        .from("profiles")
        .select("role_type")
        .eq("id", user.id)
        .maybeSingle();
      if (error) return null;
      return data as Profile | null;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  const isSuperAdmin = profile?.role_type === "super_admin";

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon">
      {/* Logo / Association name */}
      <div
        className={`flex items-center gap-2.5 h-14 border-b px-4 flex-shrink-0 ${
          collapsed ? "justify-center px-0" : ""
        }`}
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Building2 className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">
              {association?.name ?? "Húsfélagið.is"}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight truncate">
              {association?.address ?? "Fjármálagreining"}
            </p>
          </div>
        )}
      </div>

      <SidebarContent>
        {/* Main navigation */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Aðalvalmynd</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-2.5"
                      activeClassName=""
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Insights navigation */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Innsýn</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {insightItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2.5"
                      activeClassName=""
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — Settings + Admin (if super_admin) */}
      <SidebarFooter>
        <SidebarMenu>
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                <NavLink
                  to={item.url}
                  className="flex items-center gap-2.5"
                  activeClassName=""
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {/* Super admin link — only shown to super_admin users */}
          {isSuperAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/admin")} tooltip="Stjórnborð">
                <NavLink
                  to="/admin"
                  className="flex items-center gap-2.5"
                  activeClassName=""
                >
                  <Shield className="h-4 w-4 flex-shrink-0 text-primary" />
                  {!collapsed && (
                    <span className="font-medium text-primary">Stjórnborð</span>
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
