// ============================================================
// Húsfélagið.is: AppSidebar v7 — Simplified (4 items)
// Yfirlit · Peningar · Verkefni · Skjöl
// ============================================================
import {
  LayoutDashboard,
  Wallet,
  ClipboardList,
  FolderOpen,
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
  useSidebar,
} from "@/components/ui/sidebar";
import { useCurrentAssociation } from "@/hooks/useAssociation";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/db";
import type { Profile } from "@/types/database";

const navItems = [
  { title: "Yfirlit", url: "/", icon: LayoutDashboard },
  { title: "Peningar", url: "/peningar", icon: Wallet },
  { title: "Verkefni", url: "/verkefni", icon: ClipboardList },
  { title: "Skjöl", url: "/skjol", icon: FolderOpen },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { data: association } = useCurrentAssociation();
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      const { data, error } = await db
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) return null;
      return data as Profile | null;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const roleType = profile?.role_type ?? "member";
  // Admin/provider views are hidden from sidebar in v7; super_admin can still
  // reach /admin directly via URL.
  void roleType;

  const workspaceName = association?.name ?? "Húsfélagið.is";
  const workspaceSubtitle = association?.address ?? "";

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div
        className={`flex items-center gap-3 h-12 border-b border-white/10 px-4 flex-shrink-0 ${
          collapsed ? "justify-center px-2" : ""
        }`}
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
          <Building2 className="h-3.5 w-3.5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 flex items-center gap-1">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-white leading-tight truncate">
                {workspaceName}
              </p>
              {workspaceSubtitle && (
                <p className="text-[11px] text-white/50 leading-tight truncate">
                  {workspaceSubtitle}
                </p>
              )}
            </div>
            <ChevronDown className="h-3 w-3 text-white/30 flex-shrink-0 ml-auto" />
          </div>
        )}
      </div>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5 px-2">
              {navItems.map((item) => {
                const active = isActive(item.url);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.url}>
                    <Link
                      to={item.url}
                      className={`flex items-center gap-2.5 text-[13px] h-9 px-3 rounded-md transition-all duration-150 ${
                        active
                          ? "font-semibold text-white bg-white/10"
                          : "font-normal text-white/60 hover:text-white/90 hover:bg-white/5"
                      }`}
                    >
                      <Icon className={`h-[15px] w-[15px] flex-shrink-0 ${
                        active ? "text-white" : "text-white/40"
                      }`} />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
