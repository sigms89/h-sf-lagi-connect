// ============================================================
// Húsfélagið.is — AppSidebar v3
// Linear-style: left-border active accent, no bg highlight
// ============================================================
import {
  LayoutDashboard,
  Star,
  ClipboardList,
  Receipt,
  Scale,
  Store,
  Settings,
  Shield,
  Briefcase,
  Building2,
  ChevronDown,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
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

const primaryItems = [
  { title: "Yfirlit", url: "/", icon: LayoutDashboard },
  { title: "Mín verkefni", url: "/min-verkefni", icon: Star },
  { title: "Öll verkefni", url: "/verkefni", icon: ClipboardList },
  { title: "Fjármál", url: "/financials", icon: Receipt },
  { title: "Samanburður", url: "/benchmarking", icon: Scale },
  { title: "Markaðstorg", url: "/marketplace", icon: Store },
];

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

  const isFinancialsActive = isActive("/financials") ||
    location.pathname.startsWith("/transactions") ||
    location.pathname.startsWith("/classification") ||
    location.pathname.startsWith("/analytics") ||
    location.pathname.startsWith("/alerts") ||
    location.pathname.startsWith("/reports");

  const getItemActive = (url: string) => url === "/financials" ? isFinancialsActive : isActive(url);

  function NavItem({ title, url, icon: Icon }: { title: string; url: string; icon: React.ElementType }) {
    const active = getItemActive(url);
    return (
      <SidebarMenuItem>
        <Link
          to={url}
          className={`flex items-center gap-2 text-[13px] h-8 px-3 rounded-none transition-colors duration-150 ${
            active
              ? "font-semibold text-foreground border-l-2 border-l-accent ml-[-1px] pl-[calc(0.75rem-1px)]"
              : "font-normal text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Icon className={`h-[16px] w-[16px] flex-shrink-0 transition-colors duration-150 ${
            active ? "text-accent" : "text-muted-foreground/60"
          }`} />
          {!collapsed && <span>{title}</span>}
        </Link>
      </SidebarMenuItem>
    );
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      {/* ── Logo / Workspace area ───────────────────────────── */}
      <div
        className={`flex items-center gap-3 h-12 border-b border-border px-4 flex-shrink-0 ${
          collapsed ? "justify-center px-2" : ""
        }`}
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
          <Building2 className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 flex items-center gap-1">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-foreground leading-tight truncate">
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
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {primaryItems.map((item) => (
                <NavItem key={item.title} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isServiceProvider && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <NavItem title="Þjónustugátt" url="/provider" icon={Briefcase} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <DevRoleSwitcher collapsed={collapsed} />
          </SidebarMenuItem>

          <NavItem title="Stillingar" url="/settings" icon={Settings} />

          {isSuperAdmin && (
            <NavItem title="Kerfisstjórnun" url="/admin" icon={Shield} />
          )}

          {!collapsed && (
            <SidebarMenuItem>
              <div className="flex items-center gap-2.5 px-3 py-2">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-semibold text-muted-foreground">{avatarLetter}</span>
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
