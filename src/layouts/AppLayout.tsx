// ============================================================
// Húsfélagið.is — AppLayout v6 (simplified header w/ avatar menu)
// ============================================================

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const avatarLetter = user?.email?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-muted">
          <header className="h-12 flex items-center justify-between border-b border-border px-6 bg-background/80 backdrop-blur-xl sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex items-center gap-2.5">
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-7 h-7 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                    aria-label="Aðgangur"
                  >
                    <span className="text-[11px] font-semibold text-primary">{avatarLetter}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Stillingar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Skrá út
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 px-6 py-5 lg:px-8 lg:py-6">
            <div className="page-enter max-w-[1200px]">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
