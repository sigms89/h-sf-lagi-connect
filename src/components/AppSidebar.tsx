// ============================================================
// Húsfélagið.is: AppSidebar v5
// Dark mode glassmorphism sidebar with glow active state
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
  FileText,
  List,
  User,
  Users,
  FolderTree,
  ScrollText,
  Layers,
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

// ── Menu definitions per role ────────────────────────────────
const associationItems = [
  { title: "Yfirlit", url: "/", icon: LayoutDashboard },
  { title: "Mín verkefni", url: "/min-verkefni", icon: Star },
  { title: "Öll verkefni", url: "/verkefni", icon: ClipboardList },
  { title: "Fjármál", url: "/financials", icon: Receipt },
  { title: "Samanburður", url: "/benchmarking", icon: Scale },
  { title: "Markaðstorg", url: "/marketplace", icon: Store },
];

const providerItems = [
  { title: "Yfirlit", url: "/provider", icon: LayoutDashboard },
  { title: "Tilboðsbeiðnir", url: "/provider/requests", icon: FileText },
  { title: "Mín tilboð", url: "/provider/bids", icon: List },
  { title: "Prófíll", url: "/provider/profile", icon: User },
  { title: "Markaðstorg", url: "/marketplace", icon: Store },
];

const adminItems = [
  { title: "Yfirlit", url: "/admin", icon: LayoutDashboard },
  { title: "Húsfélög", url: "/admin?tab=associations", icon: Building2 },
  { title: "Notendur", url: "/admin?tab=users", icon: Users },
  { title: "Þjónustuaðilar", url: "/admin?tab=providers", icon: Briefcase },
  { title: "Flokkar", url: "/admin?tab=categories", icon: FolderTree },
  { title: "Tilboðsferlar", url: "/admin?tab=bidrequests", icon: Layers },
  { title: "Markaðstorg", url: "/marketplace", icon: Store },
  { title: "Aðgerðaskrá", url: "/admin?tab=auditlog", icon: ScrollText },
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
  const isSuperAdmin = roleType === "super_admin";
  const isServiceProvider = roleType === "service_provider";
  const avatarLetter = user?.email?.charAt(0)?.toUpperCase() ?? "?";

  // Select menu items based on role
  const primaryItems = isSuperAdmin
    ? adminItems
    : isServiceProvider
      ? providerItems
      : associationItems;

  // Workspace label
  const workspaceName = isSuperAdmin
    ? "Kerfisstjórnun"
    : isServiceProvider
      ? "Þjónustugátt"
      : (association?.name ?? "Húsfélagið.is");

  const workspaceSubtitle = isSuperAdmin
    ? "Húsfélagið.is"
    : isServiceProvider
      ? "Húsfélagið.is"
      : (association?.address ?? "Fjármálagreining");

  const isActive = (url: string) => {
    // For admin tab links
    if (url.includes("?tab=")) {
      const urlTab = new URLSearchParams(url.split("?")[1]).get("tab");
      const currentTab = new URLSearchParams(location.search).get("tab");
      return location.pathname === "/admin" && urlTab === currentTab;
    }
    if (url === "/") return location.pathname === "/";
    if (url === "/admin") return location.pathname === "/admin" && !location.search.includes("tab=");
    return location.pathname.startsWith(url);
  };

  const isFinancialsActive = location.pathname.startsWith("/financials") ||
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
          className={`flex items-center gap-2.5 text-[13px] h-8 px-3 rounded-md transition-all duration-150 ${
            active
              ? "font-semibold text-foreground bg-[rgba(255,255,255,0.08)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
              : "font-normal text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.04)]"
          }`}
        >
          <Icon className={`h-[15px] w-[15px] flex-shrink-0 transition-colors duration-150 ${
            active ? "text-primary" : "text-muted-foreground/60"
          }`} />
          {!collapsed && <span>{title}</span>}
        </Link>
      </SidebarMenuItem>
    );
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* ── Logo / Workspace area ───────────────────────────── */}
      <div
        className={`flex items-center gap-3 h-12 border-b border-sidebar-border px-4 flex-shrink-0 ${
          collapsed ? "justify-center px-2" : ""
        }`}
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.3)]">
          <Building2 className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 flex items-center gap-1">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-foreground leading-tight truncate">
                {workspaceName}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight truncate">
                {workspaceSubtitle}
              </p>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground/50 flex-shrink-0 ml-auto" />
          </div>
        )}
      </div>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5 px-2">
              {primaryItems.map((item) => (
                <NavItem key={item.url} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[rgba(255,255,255,0.06)]">
        <SidebarMenu className="gap-0.5 px-2">
          {import.meta.env.DEV && (
            <SidebarMenuItem>
              <DevRoleSwitcher collapsed={collapsed} />
            </SidebarMenuItem>
          )}

          <NavItem title="Stillingar" url="/settings" icon={Settings} />

          {!collapsed && (
            <SidebarMenuItem>
              <div className="flex items-center gap-2.5 px-3 py-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-semibold text-primary">{avatarLetter}</span>
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
