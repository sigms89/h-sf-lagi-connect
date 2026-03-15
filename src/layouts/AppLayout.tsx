// ============================================================
// Húsfélagið.is — AppLayout v2
// Premium shell: clean sidebar + refined header
// ============================================================

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { NotificationBell } from '@/components/notifications/NotificationBell';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();

  // First letter of email for avatar
  const avatarLetter = user?.email?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/60 px-8 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-muted-foreground hidden sm:inline">
                {user?.email}
              </span>
              <NotificationBell />
              <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors duration-200">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 px-8 py-6">
            <div className="page-enter">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
