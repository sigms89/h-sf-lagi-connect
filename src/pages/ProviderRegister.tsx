// ============================================================
// Húsfélagið.is — Provider Register Page
// Multi-step registration for new service providers
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { getCategoryColor } from '@/lib/categories';
import { useCategories } from '@/hooks/useCategories';
import { useCreateProvider } from '@/hooks/useServiceProvider';

// Step schemas
const step1Schema = z.object({
  company_name: z.string().min(2, 'Nafn þarf að vera að minnsta kosti 2 stafir'),
  kennitala: z.string().min(10, 'Kennitala þarf að vera 10 tölustafir').optional().or(z.literal('')),
  description_is: z.string().min(10, 'Lýsing þarf að vera að minnsta kosti 10 stafir'),
  phone: z.string().min(7, 'Símanúmer þarf að vera gilt').optional().or(z.literal('')),
  email: z.string().email('Ógild netfang'),
  website: z.string().url('Ógild vefsíðuslóð').optional().or(z.literal('')),
});

type Step1Values = z.infer<typeof step1Schema>;

const SERVICE_AREAS = [
  { value: '1', label: 'Höfuðborgarsvæði (100–199)' },
  { value: '2', label: 'Suðurnes (200–299)' },
  { value: '3', label: 'Vesturland (300–399)' },
  { value: '4', label: 'Vestfirðir (400–499)' },
  { value: '5', label: 'Norðurland vestra (500–599)' },
  { value: '6', label: 'Norðurland eystra (600–699)' },
  { value: '7', label: 'Austurland (700–799)' },
  { value: '8', label: 'Suðurland (800–899)' },
  { value: '9', label: 'Suðurland / Norðausturland (900–999)' },
];

const TOTAL_STEPS = 3;

export default function ProviderRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const { data: allCategories = [] } = useCategories();
  const createProvider = useCreateProvider();

  const expenseCategories = allCategories.filter(
    (c) => !c.name_is.includes('innborgun') && c.name_is !== 'Óflokkað'
  );

  const form1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      company_name: '',
      kennitala: '',
      description_is: '',
      phone: '',
      email: '',
      website: '',
    },
  });

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleArea = (value: string) => {
    setSelectedAreas((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  };

  const handleStep1Submit = (values: Step1Values) => {
    setStep1Data(values);
    setStep(2);
  };

  const handleStep2Next = () => {
    if (selectedCategoryIds.length === 0) return;
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    if (!step1Data) return;

    await createProvider.mutateAsync({
      company_name: step1Data.company_name,
      kennitala: step1Data.kennitala || undefined,
      description_is: step1Data.description_is,
      phone: step1Data.phone || undefined,
      email: step1Data.email,
      website: step1Data.website || undefined,
      service_area: selectedAreas,
      category_ids: selectedCategoryIds,
    });

    setSubmitted(true);
  };

  // Success screen
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-5 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Skráning móttekin</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Skráning þín bíður samþykktar stjórnanda. Þetta tekur yfirleitt 1–2 virka daga.
            Þegar skráning þín hefur verið samþykkt færðu tilkynningu.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/')}>
          Fara á forsíðu
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Skrá þjónustuaðila</h1>
          <p className="text-xs text-muted-foreground">
            Skref {step} af {TOTAL_STEPS}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i + 1 <= step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Company info */}
      {step === 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Skref 1: Upplýsingar um fyrirtæki</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form1}>
              <form onSubmit={form1.handleSubmit(handleStep1Submit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form1.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nafn fyrirtækis *</FormLabel>
                        <FormControl>
                          <Input placeholder="Fyrirtæki ehf." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form1.control}
                    name="kennitala"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kennitala</FormLabel>
                        <FormControl>
                          <Input placeholder="000000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form1.control}
                  name="description_is"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lýsing á þjónustu *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Lýstu þjónustu fyrirtækisins..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form1.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Netfang *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="info@fyrirtaeki.is" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form1.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Símanúmer</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="555-1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form1.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vefsíða</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full gap-2">
                  Áfram
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Categories & area */}
      {step === 2 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Skref 2: Flokkar og þjónustusvæði</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Categories */}
            <div>
              <p className="text-sm font-medium mb-2">Þjónustuflokkur *</p>
              <div className="flex flex-wrap gap-2">
                {expenseCategories.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  const colors = getCategoryColor(cat.color);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                        isSelected
                          ? `${colors.badge} border-current`
                          : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                      }`}
                    >
                      {cat.name_is}
                    </button>
                  );
                })}
              </div>
              {selectedCategoryIds.length === 0 && (
                <p className="text-xs text-destructive mt-2">Veldu að minnsta kosti einn flokk.</p>
              )}
            </div>

            {/* Service area */}
            <div>
              <p className="text-sm font-medium mb-2">Þjónustusvæði</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SERVICE_AREAS.map((area) => (
                  <div key={area.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`area-${area.value}`}
                      checked={selectedAreas.includes(area.value)}
                      onCheckedChange={() => toggleArea(area.value)}
                    />
                    <label
                      htmlFor={`area-${area.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {area.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Til baka
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleStep2Next}
                disabled={selectedCategoryIds.length === 0}
              >
                Áfram
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm & submit */}
      {step === 3 && step1Data && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Skref 3: Staðfesta og senda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 border p-3 space-y-2 text-sm">
              <p>
                <span className="font-medium">Fyrirtæki:</span> {step1Data.company_name}
              </p>
              {step1Data.kennitala && (
                <p>
                  <span className="font-medium">Kennitala:</span> {step1Data.kennitala}
                </p>
              )}
              <p>
                <span className="font-medium">Netfang:</span> {step1Data.email}
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {expenseCategories
                  .filter((c) => selectedCategoryIds.includes(c.id))
                  .map((cat) => {
                    const colors = getCategoryColor(cat.color);
                    return (
                      <Badge key={cat.id} className={`${colors.badge} text-xs border`}>
                        {cat.name_is}
                      </Badge>
                    );
                  })}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Með því að senda inn skráninguna samþykkir þú skilmála Húsfélagið.is. Skráningin
              fer í yfirferð hjá kerfisstjóra áður en hún er virkjuð.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Til baka
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleFinalSubmit}
                disabled={createProvider.isPending}
              >
                {createProvider.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Senda skráningu
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
