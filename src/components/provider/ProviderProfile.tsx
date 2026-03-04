// ============================================================
// Húsfélagið.is — ProviderProfile
// Edit form for service provider profile
// ============================================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MapPin } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ServiceProvider } from '@/types/database';
import { useUpdateProvider } from '@/hooks/useServiceProvider';
import { useCategories } from '@/hooks/useCategories';
import { getCategoryColor } from '@/lib/categories';

const profileSchema = z.object({
  company_name: z.string().min(2, 'Nafn þarf að vera að minnsta kosti 2 stafir'),
  kennitala: z.string().optional(),
  description_is: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Ógild netfang').optional().or(z.literal('')),
  website: z.string().url('Ógild vefsíðuslóð').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Postal code area options
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

interface ProviderProfileProps {
  provider: ServiceProvider;
}

export function ProviderProfile({ provider }: ProviderProfileProps) {
  const { data: allCategories = [] } = useCategories();
  const updateProvider = useUpdateProvider();

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    provider.categories?.map((c) => c.id) ?? []
  );
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    provider.service_area ?? []
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      company_name: provider.company_name,
      kennitala: provider.kennitala ?? '',
      description_is: provider.description_is ?? '',
      phone: provider.phone ?? '',
      email: provider.email ?? '',
      website: provider.website ?? '',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    await updateProvider.mutateAsync({
      providerId: provider.id,
      updates: {
        company_name: values.company_name,
        kennitala: values.kennitala || undefined,
        description_is: values.description_is || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        website: values.website || undefined,
        service_area: selectedAreas,
      },
      categoryIds: selectedCategoryIds,
    });
  };

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

  // Expense categories for providers
  const expenseCategories = allCategories.filter(
    (c) => !c.name_is.includes('innborgun') && c.name_is !== 'Óflokkað'
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        {/* Company info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Upplýsingar um fyrirtæki</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nafn fyrirtækis</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
              control={form.control}
              name="description_is"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lýsing</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Lýstu þjónustu fyrirtækisins..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
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
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Netfang</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="info@fyrirtaeki.is" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vefsíða</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://fyrirtaeki.is" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Þjónustuflokkur</CardTitle>
          </CardHeader>
          <CardContent>
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
              <p className="text-xs text-muted-foreground mt-2">
                Veldu að minnsta kosti einn flokk.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Service area */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Þjónustusvæði
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Button type="submit" disabled={updateProvider.isPending} className="gap-2">
          {updateProvider.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Vista breytingar
        </Button>
      </form>
    </Form>
  );
}
