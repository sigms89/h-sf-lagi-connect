// ============================================================
// Húsfélagið.is — AppSidebar v3
// Linear-style: left-border active accent, no bg highlight
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
          className={`flex items-center gap-2 text-[13px] h-9 px-3 rounded-none transition-colors duration-150 ${
            active
              ? "font-semibold text-zinc-900 border-l-2 border-l-teal-600 ml-[-1px] pl-[calc(0.75rem-1px)]"
              : "font-normal text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
          }`}
        >
          <Icon className={`h-[18px] w-[18px] flex-shrink-0 transition-colors duration-150 ${
            active ? "text-teal-600" : "text-zinc-400"
          }`} />
          {!collapsed && <span>{title}</span>}
        </Link>
      </SidebarMenuItem>
    );
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-zinc-200">
      {/* ── Logo / Workspace area ───────────────────────────── */}
      <div
        className={`flex items-center gap-3 h-14 border-b border-zinc-200 px-4 flex-shrink-0 ${
          collapsed ? "justify-center px-2" : ""
        }`}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(213,52%,24%)] to-[hsl(213,52%,32%)] flex items-center justify-center shadow-sm">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 flex items-center gap-1">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 leading-tight truncate">
                {association?.name ?? "Húsfélagið.is"}
              </p>
              <p className="text-[11px] text-zinc-500 leading-tight truncate">
                {association?.address ?? "Fjármálagreining"}
              </p>
            </div>
            <ChevronDown className="h-3 w-3 text-zinc-400 flex-shrink-0 ml-auto" />
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

      <SidebarFooter className="border-t border-zinc-200">
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
                <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-zinc-700">{avatarLetter}</span>
                </div>
                <span className="text-[11px] text-zinc-500 truncate">
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
