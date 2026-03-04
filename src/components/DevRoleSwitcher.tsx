import { useState } from "react";
import { Bug, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/integrations/supabase/db";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";

const ROLES = [
  { value: "member", label: "Meðlimur" },
  { value: "admin", label: "Stjórnarmaður" },
  { value: "super_admin", label: "Kerfisstjóri" },
] as const;

export function DevRoleSwitcher({ collapsed }: { collapsed: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [switching, setSwitching] = useState(false);

  const switchRole = async (role: string) => {
    if (!user) return;
    setSwitching(true);
    try {
      const { error } = await db
        .from("profiles")
        .update({ role_type: role })
        .eq("user_id", user.id);

      if (error) throw error;

      // Invalidate all queries to refresh UI
      queryClient.invalidateQueries();
      toast.success(`Hlutverk breytt í: ${ROLES.find((r) => r.value === role)?.label}`);
    } catch (e: any) {
      toast.error(`Villa: ${e.message}`);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          tooltip="Þróunarverkfæri"
          className="text-amber-600 dark:text-amber-400"
          disabled={switching}
        >
          <Bug className="h-4 w-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="text-xs font-medium">Skipta um hlutverk</span>
              <ChevronDown className="ml-auto h-3 w-3" />
            </>
          )}
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top">
        {ROLES.map((role) => (
          <DropdownMenuItem key={role.value} onClick={() => switchRole(role.value)}>
            {role.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
