// ============================================================
// Húsfélagið.is — AppLayout v5 (Arctic Editorial)
// Tonal layering, no aurora
// ============================================================

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { NotificationBell } from '@/components/notifications/NotificationBell';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-muted">
          <header className="h-12 flex items-center justify-between border-b border-border px-6 bg-background/80 backdrop-blur-xl sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex items-center gap-2.5">
              <span className="text-[12px] text-muted-foreground hidden sm:inline">
                {user?.email}
              </span>
              <NotificationBell />
              <Button variant="ghost" size="icon" onClick={signOut} className="h-7 w-7 text-muted-foreground hover:text-foreground transition-colors duration-150">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </header>
          <main className="flex-1 px-6 py-5 lg:px-8 lg:py-6">
            <div className="page-enter max-w-[1200px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
