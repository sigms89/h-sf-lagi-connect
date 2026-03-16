// ============================================================
// Húsfélagið.is — Onboarding Page
// First-time setup wizard: create association + invite board members + upload first data
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Upload,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { useCreateAssociation } from '@/hooks/useAssociation';
import { UploadTransactions } from '@/components/transactions/UploadTransactions';
import { toast } from 'sonner';

// ============================================================
// SCHEMA
// ============================================================
const onboardingSchema = z.object({
  name: z.string().min(2, 'Nafn verður að vera að minnsta kosti 2 stafir'),
  address: z.string().optional(),
  postal_code: z.string().min(3, 'Póstnúmer vantar — nauðsynlegt fyrir samanburð'),
  city: z.string().default('Reykjavík'),
  num_units: z.number().int().min(1, 'Hlýtur að vera a.m.k. 1 íbúð').max(999),
  type: z.enum(['fjolbyli', 'radhus', 'parhus']),
  building_year: z.number({ required_error: 'Byggingarár vantar — nauðsynlegt fyrir samanburð' }).int().min(1800, 'Ólöglegt byggingarár').max(2030, 'Ólöglegt byggingarár'),
  has_elevator: z.boolean(),
  has_parking: z.boolean(),
  num_floors: z.number().int().min(1),
  square_meters_total: z.number().positive().optional().nullable(),
});

type OnboardingData = z.infer<typeof onboardingSchema>;

// ============================================================
// STEPS
// ============================================================
const STEPS = [
  { id: 1, title: 'Velkomin!', subtitle: 'Skref 1 af 4' },
  { id: 2, title: 'Upplýsingar um húsfélag', subtitle: 'Skref 2 af 4' },
  { id: 3, title: 'Boða stjórnarmenn', subtitle: 'Skref 3 af 4 (valkvæmt)' },
  { id: 4, title: 'Hlaða upp bankafærslum', subtitle: 'Skref 4 af 4 (valkvæmt)' },
];

// ============================================================
// INVITE FORM SUB-COMPONENT
// ============================================================
interface InviteRow {
  email: string;
  role: 'board' | 'member';
}

function InviteForm({ associationId }: { associationId: string }) {
  const [rows, setRows] = useState<InviteRow[]>([
    { email: '', role: 'board' },
    { email: '', role: 'board' },
    { email: '', role: 'board' },
  ]);
  const [sending, setSending] = useState(false);

  const updateRow = (index: number, field: keyof InviteRow, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const addRow = () => {
    if (rows.length >= 10) return;
    setRows((prev) => [...prev, { email: '', role: 'board' }]);
  };

  const handleSend = async () => {
    const filled = rows.filter((r) => r.email.trim() !== '');
    if (filled.length === 0) {
      toast.info('Settu inn a.m.k. eitt netfang til að senda boð');
      return;
    }
    setSending(true);
    // Boðskerfi er í vinnslu — sýnum UI-only töfrastig
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSending(false);
    toast.info('Boðskerfi er í vinnslu — netföngin verða vistuð þegar kerfið er tilbúið');
  };

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={index} className="flex gap-2">
          <Input
            type="email"
            placeholder={`netfang@dæmi.is`}
            value={row.email}
            onChange={(e) => updateRow(index, 'email', e.target.value)}
            className="flex-1 h-9 text-sm"
          />
          <Select
            value={row.role}
            onValueChange={(v) => updateRow(index, 'role', v as 'board' | 'member')}
          >
            <SelectTrigger className="h-9 w-32 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="board">Stjórn</SelectItem>
              <SelectItem value="member">Meðlimur</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ))}
      <div className="flex gap-2">
        {rows.length < 10 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={addRow}
          >
            + Bæta við línu
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          className="h-7 text-xs ml-auto"
          onClick={handleSend}
          disabled={sending}
        >
          {sending ? (
            <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Sendir...</>
          ) : (
            'Senda boð'
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT
// ============================================================
export default function Onboarding() {
  const navigate = useNavigate();
  const createAssociation = useCreateAssociation();
  const [step, setStep] = useState(1);
  const [createdAssociationId, setCreatedAssociationId] = useState<string | null>(null);

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: '',
      address: '',
      postal_code: '',
      city: 'Reykjavík',
      num_units: 10,
      type: 'fjolbyli',
      building_year: undefined as unknown as number,
      has_elevator: false,
      has_parking: false,
      num_floors: 4,
      square_meters_total: null,
    },
  });

  const progressPercent = (step / STEPS.length) * 100;

  // ============================================================
  // SUBMIT STEP 2 — Create association
  // ============================================================
  const handleCreateAssociation = async (data: OnboardingData) => {
    const result = await createAssociation.mutateAsync({
      name: data.name,
      address: data.address ?? null,
      postal_code: data.postal_code ?? null,
      city: data.city,
      num_units: data.num_units,
      type: data.type,
      building_year: data.building_year ?? null,
      has_elevator: data.has_elevator,
      has_parking: data.has_parking,
      num_floors: data.num_floors,
      square_meters_total: data.square_meters_total ?? null,
      subscription_tier: 'free',
      subscription_status: 'active',
    });
    setCreatedAssociationId(result.id);
    setStep(3); // Step 3 is now invite board members
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground mb-4">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Húsfélagið.is</h1>
          <p className="text-muted-foreground mt-1">
            Fjármálagreining fyrir íslensk húsfélög
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{STEPS[step - 1]?.subtitle}</span>
            <span>{step} / {STEPS.length}</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        {/* ---- STEP 1: Welcome ---- */}
        {step === 1 && (
          <Card>
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-xl">Velkomin í Húsfélagið.is!</CardTitle>
              <CardDescription>
                Við hjálpum stjórnum húsfélaga að halda utan um fjármál, bera saman kostnað
                við önnur húsfélög og finna betri þjónustuaðila.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    icon: '📊',
                    title: 'Sjálfvirk flokkun',
                    desc: 'Bankafærslur flokkaðar sjálfkrafa í kostnaðarflokka',
                  },
                  {
                    icon: '⚖️',
                    title: 'Samanburður',
                    desc: 'Berðu kostnað saman við sambærileg húsfélög',
                  },
                  {
                    icon: '🏪',
                    title: 'Markaðstorg',
                    desc: 'Fáðu tilboð frá þjónustuaðilum og berðu þau saman',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={() => setStep(2)}>
                Byrja uppsetningu
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ---- STEP 2: Association details ---- */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Upplýsingar um húsfélagið</CardTitle>
              <CardDescription>
                Þessar upplýsingar eru notaðar í greiningu og samanburði við önnur húsfélög.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(handleCreateAssociation)}
                className="space-y-4"
              >
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nafn húsfélags *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="t.d. Húsfélag Laugavegar 12"
                    autoFocus
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                {/* Address */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="address">Heimilisfang</Label>
                    <Input
                      id="address"
                      {...form.register('address')}
                      placeholder="Laugavegur 12"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="postal_code">Póstnúmer</Label>
                    <Input
                      id="postal_code"
                      {...form.register('postal_code')}
                      placeholder="101"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">Bær</Label>
                    <Input
                      id="city"
                      {...form.register('city')}
                      placeholder="Reykjavík"
                    />
                  </div>
                </div>

                {/* Units + Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="num_units">Fjöldi íbúða *</Label>
                    <Input
                      id="num_units"
                      type="number"
                      min={1}
                      {...form.register('num_units', { valueAsNumber: true })}
                    />
                    {form.formState.errors.num_units && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.num_units.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tegund húss</Label>
                    <Select
                      value={form.watch('type')}
                      onValueChange={(v) =>
                        form.setValue('type', v as 'fjolbyli' | 'radhus' | 'parhus')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fjolbyli">Fjölbýlishús</SelectItem>
                        <SelectItem value="radhus">Raðhús</SelectItem>
                        <SelectItem value="parhus">Parhús</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Year + Floors */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="building_year">Byggingarár</Label>
                    <Input
                      id="building_year"
                      type="number"
                      placeholder="1975"
                      {...form.register('building_year', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="num_floors">Fjöldi hæða</Label>
                    <Input
                      id="num_floors"
                      type="number"
                      min={1}
                      {...form.register('num_floors', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex gap-8 pt-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="has_elevator_ob"
                      checked={form.watch('has_elevator')}
                      onCheckedChange={(v) => form.setValue('has_elevator', v)}
                    />
                    <Label htmlFor="has_elevator_ob">Lyfta</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="has_parking_ob"
                      checked={form.watch('has_parking')}
                      onCheckedChange={(v) => form.setValue('has_parking', v)}
                    />
                    <Label htmlFor="has_parking_ob">Bílastæði</Label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Til baka
                  </Button>
                  <Button type="submit" className="flex-1" disabled={createAssociation.isPending}>
                    {createAssociation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Stofna húsfélag...
                      </>
                    ) : (
                      <>
                        Stofna húsfélag
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ---- STEP 3: Invite board members (optional) ---- */}
        {step === 3 && createdAssociationId && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Boða stjórnarmenn</CardTitle>
                  <CardDescription>
                    Sendu boð til annarra stjórnarmanna í húsfélaginu (valkvæmt)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <InviteForm associationId={createdAssociationId} />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(4)}>
                  Sleppa — boða síðar
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1">
                  Áfram
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ---- STEP 4: Upload data (optional) ---- */}
        {step === 4 && createdAssociationId && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <CardTitle>Húsfélagið er tilbúið!</CardTitle>
                  <CardDescription>
                    Þú getur nú hlaðið upp bankafærslum til greiningar (valkvæmt)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <UploadTransactions
                associationId={createdAssociationId}
                onSuccess={() => navigate('/')}
                testModeDefault={true}
              />
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="text-muted-foreground text-xs"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Sleppa — hlaða upp síðar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
