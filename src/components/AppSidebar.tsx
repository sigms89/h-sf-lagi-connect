// ============================================================
// Húsfélagið.is — AppSidebar v2
// Mercury × Linear: clean, confident, 4 primary destinations
// ============================================================
import {
  LayoutDashboard,
  Receipt,
  Scale,
  Store,
  Settings,
  Shield,
  Briefcase,
  Building2,
  ChevronDown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCurrentAssociation } from "@/hooks/useAssociation";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/db";
import type { Profile } from "@/types/database";
import { DevRoleSwitcher } from "@/components/DevRoleSwitcher";

// ============================================================
// NAV ITEMS — 4 primary destinations
// ============================================================
const primaryItems = [
  { title: "Yfirlit", url: "/", icon: LayoutDashboard },
  { title: "Fjármál", url: "/financials", icon: Receipt },
  { title: "Samanburður", url: "/benchmarking", icon: Scale },
  { title: "Markaðstorg", url: "/marketplace", icon: Store },
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

  const { data: profile } = useQuery({
    queryKey: ["profile-sidebar", user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      const { data, error } = await db
        .from("profiles")
        .select("role_type")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) return null;
      return data as Profile | null;
    },
    enabled: !!user,
    staleTime: 0,
  });

  const roleType = profile?.role_type ?? "member";
  const isSuperAdmin = roleType === "super_admin";
  const isServiceProvider = roleType === "service_provider";

  const avatarLetter = user?.email?.charAt(0)?.toUpperCase() ?? "?";

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  // Old routes that now map to /financials
  const isFinancialsActive = isActive("/financials") ||
    location.pathname.startsWith("/transactions") ||
    location.pathname.startsWith("/classification") ||
    location.pathname.startsWith("/analytics") ||
    location.pathname.startsWith("/alerts") ||
    location.pathname.startsWith("/reports");

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* ── Logo / Workspace area ───────────────────────────── */}
      <div
        className={`flex items-center gap-3 h-14 border-b border-sidebar-border px-4 flex-shrink-0 ${
          collapsed ? "justify-center px-2" : ""
        }`}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(213,52%,24%)] to-[hsl(213,52%,32%)] flex items-center justify-center shadow-sm">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 flex items-center gap-1">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight truncate">
                {association?.name ?? "Húsfélagið.is"}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight truncate">
                {association?.address ?? "Fjármálagreining"}
              </p>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground/50 flex-shrink-0 ml-auto" />
          </div>
        )}
      </div>

      <SidebarContent className="pt-2">
        {/* ── Primary navigation ─────────────────────────── */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {primaryItems.map((item) => {
                const active = item.url === "/financials" ? isFinancialsActive : isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} className="h-9 px-3">
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={`flex items-center gap-2 text-[13px] rounded-lg transition-all duration-200
                          ${active
                            ? "font-semibold text-foreground nav-active-accent"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                          }`}
                        activeClassName=""
                      >
                        <item.icon className={`h-[18px] w-[18px] flex-shrink-0 transition-colors duration-200 ${
                          active ? "text-foreground" : "text-muted-foreground"
                        }`} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Provider section ────────────────────────────── */}
        {isServiceProvider && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Þjónustugátt" className="h-9 px-3">
                    <NavLink
                      to="/provider"
                      className={`flex items-center gap-2 text-[13px] rounded-lg transition-all duration-200
                        ${isActive("/provider")
                          ? "font-semibold text-foreground nav-active-accent"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                        }`}
                      activeClassName=""
                    >
                      <Briefcase className={`h-[18px] w-[18px] flex-shrink-0 ${
                        isActive("/provider") ? "text-foreground" : "text-muted-foreground"
                      }`} />
                      {!collapsed && <span>Þjónustugátt</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ── Footer ──────────────────────────────────────── */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu className="gap-0.5">
          {/* Dev role switcher */}
          <SidebarMenuItem>
            <DevRoleSwitcher collapsed={collapsed} />
          </SidebarMenuItem>

          {/* Settings */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Stillingar" className="h-9 px-3">
              <NavLink
                to="/settings"
                className={`flex items-center gap-2 text-[13px] rounded-lg transition-all duration-200
                  ${isActive("/settings")
                    ? "font-semibold text-foreground nav-active-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                activeClassName=""
              >
                <Settings className={`h-[18px] w-[18px] flex-shrink-0 ${
                  isActive("/settings") ? "text-foreground" : "text-muted-foreground"
                }`} />
                {!collapsed && <span>Stillingar</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Admin */}
          {isSuperAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Kerfisstjórnun" className="h-9 px-3">
                <NavLink
                  to="/admin"
                  className={`flex items-center gap-2 text-[13px] rounded-lg transition-all duration-200
                    ${isActive("/admin")
                      ? "font-semibold text-foreground nav-active-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    }`}
                  activeClassName=""
                >
                  <Shield className={`h-[18px] w-[18px] flex-shrink-0 ${
                    isActive("/admin") ? "text-foreground" : "text-muted-foreground"
                  }`} />
                  {!collapsed && <span>Kerfisstjórnun</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* User avatar + email */}
          {!collapsed && (
            <SidebarMenuItem>
              <div className="flex items-center gap-2.5 px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-foreground">{avatarLetter}</span>
                </div>
                <span className="text-[11px] text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
