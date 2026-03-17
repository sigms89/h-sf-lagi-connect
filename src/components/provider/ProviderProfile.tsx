// ============================================================
// Húsfélagið.is — ProviderProfile
// Edit form for service provider profile + portfolio + reviews
// ============================================================

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { is as isLocale } from 'date-fns/locale';
import { ImagePlus, Loader2, MapPin, MessageSquare, Plus, Star, Trash2, Upload } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ServiceProvider } from '@/types/database';
import { useUpdateProvider } from '@/hooks/useServiceProvider';
import { useCategories } from '@/hooks/useCategories';
import { getCategoryColor } from '@/lib/categories';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProviderReviews, useRespondToReview } from '@/hooks/useProviderReviews';
import { usePortfolioImages, useUploadPortfolioImage, useDeletePortfolioImage } from '@/hooks/useProviderPortfolio';

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

  // Logo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(provider.logo_url ?? null);
  const [uploading, setUploading] = useState(false);

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Mynd má ekki vera stærri en 2MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `provider-logos/${provider.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('public').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      // Update provider record
      await supabase
        .from('service_providers')
        .update({ logo_url: publicUrl })
        .eq('id', provider.id);

      setLogoUrl(publicUrl);
      toast.success('Merki uppfært');
    } catch (err: any) {
      toast.error(`Villa við upphleðslu: ${err.message}`);
    } finally {
      setUploading(false);
      // Reset the input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await supabase
        .from('service_providers')
        .update({ logo_url: null })
        .eq('id', provider.id);
      setLogoUrl(null);
      toast.success('Merki fjarlægt');
    } catch (err: any) {
      toast.error(`Villa: ${err.message}`);
    }
  };

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

  // Portfolio & reviews
  const { data: portfolioImages = [] } = usePortfolioImages(provider.id);
  const uploadImage = useUploadPortfolioImage();
  const deleteImage = useDeletePortfolioImage();
  const { data: reviews = [] } = useProviderReviews(provider.id);
  const respondToReview = useRespondToReview();
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      await uploadImage.mutateAsync({ providerId: provider.id, file });
    }
    if (portfolioInputRef.current) portfolioInputRef.current.value = '';
  };

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;
    await respondToReview.mutateAsync({
      reviewId,
      providerId: provider.id,
      response: responseText,
    });
    setRespondingTo(null);
    setResponseText('');
  };

  return (
    <Tabs defaultValue="profile" className="max-w-2xl">
      <TabsList className="mb-4">
        <TabsTrigger value="profile">Prófíll</TabsTrigger>
        <TabsTrigger value="portfolio">
          Myndir
          {portfolioImages.length > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
              {portfolioImages.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="reviews">
          Umsagnir
          {reviews.length > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
              {reviews.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      {/* Profile tab */}
      <TabsContent value="profile">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Upplýsingar um fyrirtæki</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Merki fyrirtækis</p>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                        Hlaða upp
                      </Button>
                      {logoUrl && (
                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={handleRemoveLogo}>
                          Fjarlægja
                        </Button>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="company_name" render={({ field }) => (
                    <FormItem><FormLabel>Nafn fyrirtækis</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="kennitala" render={({ field }) => (
                    <FormItem><FormLabel>Kennitala</FormLabel><FormControl><Input placeholder="000000-0000" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="description_is" render={({ field }) => (
                  <FormItem><FormLabel>Lýsing</FormLabel><FormControl><Textarea placeholder="Lýstu þjónustu fyrirtækisins..." rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Símanúmer</FormLabel><FormControl><Input type="tel" placeholder="555-1234" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Netfang</FormLabel><FormControl><Input type="email" placeholder="info@fyrirtaeki.is" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="website" render={({ field }) => (
                    <FormItem><FormLabel>Vefsíða</FormLabel><FormControl><Input type="url" placeholder="https://fyrirtaeki.is" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Þjónustuflokkur</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {expenseCategories.map((cat) => {
                    const isSelected = selectedCategoryIds.includes(cat.id);
                    const colors = getCategoryColor(cat.color);
                    return (
                      <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${isSelected ? `${colors.badge} border-current` : 'bg-muted text-muted-foreground border-transparent hover:border-border'}`}>
                        {cat.name_is}
                      </button>
                    );
                  })}
                </div>
                {selectedCategoryIds.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">Veldu að minnsta kosti einn flokk.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" />Þjónustusvæði
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SERVICE_AREAS.map((area) => (
                    <div key={area.value} className="flex items-center gap-2">
                      <Checkbox id={`area-${area.value}`} checked={selectedAreas.includes(area.value)} onCheckedChange={() => toggleArea(area.value)} />
                      <label htmlFor={`area-${area.value}`} className="text-sm cursor-pointer">{area.label}</label>
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
      </TabsContent>

      {/* Portfolio tab */}
      <TabsContent value="portfolio">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Myndagallerí</CardTitle>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => portfolioInputRef.current?.click()} disabled={uploadImage.isPending}>
                {uploadImage.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Bæta við mynd
              </Button>
              <input ref={portfolioInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={handlePortfolioUpload} />
            </div>
          </CardHeader>
          <CardContent>
            {portfolioImages.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed rounded-lg">
                <ImagePlus className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Engar myndir enn</p>
                <p className="text-xs text-muted-foreground mt-1">Bættu við myndum af verkefnum til að sýna þjónustu þína</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {portfolioImages.map((img) => (
                  <div key={img.id} className="group relative aspect-[4/3] rounded-lg overflow-hidden border">
                    <img src={img.image_url} alt={img.caption ?? 'Verkefnamynd'} className="w-full h-full object-cover" />
                    <button
                      onClick={() => deleteImage.mutate({ imageId: img.id, providerId: provider.id, imageUrl: img.image_url })}
                      className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {img.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
                        <p className="text-[11px] text-white/90 line-clamp-1">{img.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Reviews tab */}
      <TabsContent value="reviews">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Umsagnir viðskiptavina
              {reviews.length > 0 && <span className="text-muted-foreground font-normal ml-2">({reviews.length})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Engar umsagnir enn.</p>
                <p className="text-xs text-muted-foreground mt-1">Umsagnir birtast hér þegar viðskiptavinir hafa metið þjónustu þína.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex gap-0.5 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {review.association_num_units
                            ? `${review.association_num_units} íbúða húsfélag${review.association_postal_code ? ` í póstnúmeri ${review.association_postal_code}` : ''}`
                            : 'Húsfélag'}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground flex-shrink-0">
                        {format(new Date(review.created_at), 'd. MMM yyyy', { locale: isLocale })}
                      </p>
                    </div>

                    {review.comment && <p className="text-sm">{review.comment}</p>}

                    {review.provider_response ? (
                      <div className="ml-4 pl-3 border-l-2 border-accent/30 bg-accent/5 rounded-r-md py-2 pr-3">
                        <p className="text-[11px] font-medium text-accent mb-1">Þitt svar</p>
                        <p className="text-sm text-muted-foreground">{review.provider_response}</p>
                      </div>
                    ) : respondingTo === review.id ? (
                      <div className="ml-4 space-y-2">
                        <Textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Skrifa svar..." rows={3} className="text-sm" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleRespond(review.id)} disabled={respondToReview.isPending || !responseText.trim()}>Senda svar</Button>
                          <Button size="sm" variant="ghost" onClick={() => { setRespondingTo(null); setResponseText(''); }}>Hætta við</Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-xs gap-1 text-muted-foreground" onClick={() => setRespondingTo(review.id)}>
                        <MessageSquare className="h-3 w-3" />Svara
                      </Button>
                    )}

                    <Separator />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
