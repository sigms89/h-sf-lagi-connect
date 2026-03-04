// ============================================================
// Húsfélagið.is — BidRequestForm
// Form to create a new bid request
// ============================================================

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/lib/categories';
import type { Association } from '@/types/database';
import { useCreateBidRequest } from '@/hooks/useMarketplace';
import { useAuth } from '@/hooks/useAuth';

const formSchema = z.object({
  categoryId: z.string().min(1, 'Veldu flokk'),
  title: z.string().min(3, 'Titill þarf að vera að minnsta kosti 3 stafir'),
  description: z.string().optional(),
  deadline: z.date({ required_error: 'Veldu lokadagsetningu' }),
});

type FormValues = z.infer<typeof formSchema>;

interface BidRequestFormProps {
  open: boolean;
  onClose: () => void;
  association: Association;
}

// Category options: expense categories that make sense for bidding
const EXPENSE_CATEGORIES = CATEGORIES.filter(
  (c) => !c.isIncome && c.slug !== 'oflokkad' && c.slug !== 'husfelagsgjold-innborgun'
);

function generateDescription(association: Association, categoryName: string): string {
  const parts: string[] = [];
  parts.push(`Húsfélag með ${association.num_units} íbúðir`);
  if (association.num_floors > 0) {
    parts.push(`${association.num_floors} hæðir`);
  }
  if (association.building_year) {
    parts.push(`byggt ${association.building_year}`);
  }
  if (association.address) {
    parts.push(`staðsetning: ${association.address}`);
  }
  if (association.city) {
    parts.push(association.city);
  }
  parts.push(`óskar eftir tilboðum í ${categoryName.toLowerCase()}`);
  return parts.join(', ') + '.';
}

export function BidRequestForm({ open, onClose, association }: BidRequestFormProps) {
  const { user } = useAuth();
  const createBidRequest = useCreateBidRequest();
  const { data: dbCategories = [] } = useCategories();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: '',
      title: '',
      description: '',
      deadline: addDays(new Date(), 14),
    },
  });

  const selectedCategoryId = form.watch('categoryId');

  // Auto-generate title and description when category changes
  useEffect(() => {
    if (!selectedCategoryId) return;
    const cat = EXPENSE_CATEGORIES.find((c) => c.slug === selectedCategoryId);
    if (!cat) return;
    form.setValue(
      'title',
      `Tilboðsbeiðni: ${cat.nameIs} — ${association.name}`
    );
    form.setValue('description', generateDescription(association, cat.nameIs));
  }, [selectedCategoryId, association, form]);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;

    // Find category DB id by matching name_is
    const catNameIs = EXPENSE_CATEGORIES.find((c) => c.slug === values.categoryId)?.nameIs ?? '';
    const dbCat = dbCategories.find((c) => c.name_is === catNameIs);

    const categoryDbId = dbCat?.id;
    if (!categoryDbId) {
      form.setError('categoryId', { message: 'Flokkur fannst ekki' });
      return;
    }

    await createBidRequest.mutateAsync({
      association_id: association.id,
      created_by: user.id,
      category_id: categoryDbId,
      title: values.title,
      description: values.description || undefined,
      deadline: format(values.deadline, 'yyyy-MM-dd'),
    });

    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ný tilboðsbeiðni</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Category */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flokkur</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Veldu þjónustuflokk" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.slug} value={cat.slug}>
                          {cat.nameIs}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titill</FormLabel>
                  <FormControl>
                    <Input placeholder="Titill tilboðsbeiðni" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lýsing</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Lýstu verkefninu nánar..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Deadline */}
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Lokadagur</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'dd. MMM yyyy')
                          ) : (
                            <span>Veldu dagsetningu</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Hætta við
              </Button>
              <Button type="submit" disabled={createBidRequest.isPending}>
                {createBidRequest.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Senda tilboðsbeiðni
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
