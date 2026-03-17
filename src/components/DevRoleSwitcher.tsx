import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bug, ChevronDown, Check, Sprout, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/integrations/supabase/db";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import type { Profile } from "@/types/database";

const ROLES = [
  { value: "member", label: "Meðlimur", description: "Skoðar eigin húsfélag" },
  { value: "admin", label: "Stjórnarmaður", description: "Breytir stillingum húsfélags" },
  { value: "super_admin", label: "Kerfisstjóri", description: "Sér admin panel + allt" },
  { value: "service_provider", label: "Þjónustuaðili", description: "Sér provider gáttina" },
] as const;

export function DevRoleSwitcher({ collapsed }: { collapsed: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [switching, setSwitching] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Read current role from cache or DB
  const { data: currentProfile } = useQuery({
    queryKey: ["dev-role-current", user?.id],
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
    staleTime: 0,
  });

  const currentRole = currentProfile?.role_type ?? "member";

  const switchRole = async (role: string) => {
    if (!user || role === currentRole) return;
    setSwitching(true);
    try {
      const { error } = await db
        .from("profiles")
        .update({ role_type: role })
        .eq("user_id", user.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["profile-sidebar"] });
      await queryClient.invalidateQueries({ queryKey: ["dev-role-current"] });
      await queryClient.invalidateQueries({ queryKey: ["current-provider"] });

      toast.success(
        `Hlutverk breytt í: ${ROLES.find((r) => r.value === role)?.label}`,
        { description: "Síðan uppfærist sjálfkrafa." }
      );
    } catch (e: any) {
      toast.error(`Villa: ${e.message}`);
    } finally {
      setSwitching(false);
    }
  };

  const callSeedFunction = async (action: "seed" | "teardown") => {
    if (seeding) return;
    setSeeding(true);
    const label = action === "seed" ? "Setja inn demo gögn" : "Fjarlægja demo gögn";
    try {
      const { data, error } = await supabase.functions.invoke("dev-seed", {
        body: { action },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(data?.message ?? `${label} — lokið!`);

      // Invalidate everything so UI refreshes
      await queryClient.invalidateQueries();
    } catch (e: any) {
      toast.error(`${label} mistókst: ${e.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          tooltip="Þróunarverkfæri — Skipta um hlutverk"
          className="text-amber-500 hover:text-amber-400"
          disabled={switching || seeding}
        >
          <Bug className="h-4 w-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <div className="flex flex-col items-start min-w-0">
                <span className="text-[10px] leading-tight opacity-60">DEV</span>
                <span className="text-xs font-medium leading-tight truncate">
                  {ROLES.find((r) => r.value === currentRole)?.label ?? currentRole}
                </span>
              </div>
              <ChevronDown className="ml-auto h-3 w-3" />
            </>
          )}
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        {ROLES.map((role) => (
          <DropdownMenuItem
            key={role.value}
            onClick={() => switchRole(role.value)}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium">{role.label}</p>
              <p className="text-xs text-muted-foreground">{role.description}</p>
            </div>
            {currentRole === role.value && (
              <Check className="h-4 w-4 text-green-600 shrink-0 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => callSeedFunction("seed")}
          disabled={seeding}
          className="flex items-center gap-2"
        >
          <Sprout className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-sm font-medium">Setja inn demo gögn</p>
            <p className="text-xs text-muted-foreground">3 húsfélög, færslur, verkefni</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => callSeedFunction("teardown")}
          disabled={seeding}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
          <div>
            <p className="text-sm font-medium">Fjarlægja demo gögn</p>
            <p className="text-xs text-muted-foreground">Eyðir öllu sem er merkt DEMO</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
