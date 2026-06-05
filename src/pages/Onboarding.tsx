// ============================================================
// Húsfélagið.is: Onboarding v2 — Simplified 3-step wizard
// 1) Hver ert þú?  2) Hvar er húsfélagið?  3) Hladdu inn bankayfirliti
// ============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Building2, Upload, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { useCreateAssociation } from "@/hooks/useAssociation";
import { UploadTransactions } from "@/components/transactions/UploadTransactions";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/integrations/supabase/db";
import { toast } from "sonner";

const stepOneSchema = z.object({
  full_name: z.string().min(2, "Settu inn nafnið þitt"),
  association_name: z.string().min(2, "Nafn húsfélags vantar"),
});
const stepTwoSchema = z.object({
  address: z.string().min(2, "Heimilisfang vantar"),
  postal_code: z.string().min(3, "Póstnúmer vantar"),
  num_units: z.number().int().min(1, "Þarf að vera a.m.k. 1 íbúð").max(999),
});

type StepOneData = z.infer<typeof stepOneSchema>;
type StepTwoData = z.infer<typeof stepTwoSchema>;

const TOTAL_STEPS = 3;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createAssociation = useCreateAssociation();
  const [step, setStep] = useState(1);
  const [stepOneData, setStepOneData] = useState<StepOneData | null>(null);
  const [createdAssociationId, setCreatedAssociationId] = useState<string | null>(null);

  const formOne = useForm<StepOneData>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: { full_name: "", association_name: "" },
  });

  const formTwo = useForm<StepTwoData>({
    resolver: zodResolver(stepTwoSchema),
    defaultValues: { address: "", postal_code: "", num_units: 10 },
  });

  const handleStepOne = (data: StepOneData) => {
    setStepOneData(data);
    setStep(2);
  };

  const handleStepTwo = async (data: StepTwoData) => {
    if (!stepOneData || !user) return;
    try {
      // Update profile full name
      await db.from("profiles").update({ full_name: stepOneData.full_name }).eq("user_id", user.id);

      // Create association with sensible defaults for hidden fields
      const result = await createAssociation.mutateAsync({
        name: stepOneData.association_name,
        address: data.address,
        postal_code: data.postal_code,
        city: "Reykjavík",
        num_units: data.num_units,
        type: "fjolbyli",
        building_year: null,
        has_elevator: false,
        has_parking: false,
        num_floors: 1,
        square_meters_total: null,
        subscription_tier: "free",
        subscription_status: "active",
      });
      setCreatedAssociationId(result.id);
      setStep(3);
    } catch (err) {
      toast.error("Villa við að stofna húsfélag");
    }
  };

  const progressPercent = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground mb-4">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Húsfélagið.is</h1>
        </div>

        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Skref {step} af {TOTAL_STEPS}</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        {/* ── Skref 1: Hver ert þú? ─────────────────────────── */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Hver ert þú?</CardTitle>
              <CardDescription>Látum vita hver stjórnar og við stillum restina fyrir þig.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={formOne.handleSubmit(handleStepOne)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name">Nafnið þitt</Label>
                  <Input
                    id="full_name"
                    autoFocus
                    placeholder="t.d. Sigríður Jónsdóttir"
                    {...formOne.register("full_name")}
                  />
                  {formOne.formState.errors.full_name && (
                    <p className="text-xs text-destructive">{formOne.formState.errors.full_name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Netfang</Label>
                  <Input value={user?.email ?? ""} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="association_name">Nafn húsfélagsins</Label>
                  <Input
                    id="association_name"
                    placeholder="t.d. Húsfélag Laugavegar 12"
                    {...formOne.register("association_name")}
                  />
                  {formOne.formState.errors.association_name && (
                    <p className="text-xs text-destructive">{formOne.formState.errors.association_name.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  Áfram <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Skref 2: Hvar er húsfélagið? ───────────────────── */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Hvar er húsfélagið?</CardTitle>
              <CardDescription>Heimilisfang og fjöldi íbúða.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={formTwo.handleSubmit(handleStepTwo)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="address">Heimilisfang</Label>
                  <Input
                    id="address"
                    autoFocus
                    placeholder="t.d. Laugavegur 12"
                    {...formTwo.register("address")}
                  />
                  {formTwo.formState.errors.address && (
                    <p className="text-xs text-destructive">{formTwo.formState.errors.address.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="postal_code">Póstnúmer</Label>
                    <Input
                      id="postal_code"
                      placeholder="101"
                      {...formTwo.register("postal_code")}
                    />
                    {formTwo.formState.errors.postal_code && (
                      <p className="text-xs text-destructive">{formTwo.formState.errors.postal_code.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="num_units">Fjöldi íbúða</Label>
                    <Input
                      id="num_units"
                      type="number"
                      min={1}
                      {...formTwo.register("num_units", { valueAsNumber: true })}
                    />
                    {formTwo.formState.errors.num_units && (
                      <p className="text-xs text-destructive">{formTwo.formState.errors.num_units.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Til baka
                  </Button>
                  <Button type="submit" className="flex-1" disabled={createAssociation.isPending}>
                    {createAssociation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Stofnar...</>
                    ) : (
                      <>Áfram <ChevronRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Skref 3: Hladdu inn bankayfirliti ──────────────── */}
        {step === 3 && createdAssociationId && (
          <Card>
            <CardHeader>
              <CardTitle>Hladdu inn bankayfirliti</CardTitle>
              <CardDescription>
                Þú getur líka hoppað yfir þetta og gert það þegar þér hentar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <UploadTransactions
                associationId={createdAssociationId}
                onSuccess={() => navigate("/")}
                testModeDefault={false}
              />
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => navigate("/")}
              >
                <Upload className="h-4 w-4 mr-2" />
                Sleppa — gera seinna
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
