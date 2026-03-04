// ============================================================
// Húsfélagið.is — SubmitBidForm
// Dialog form for a provider to submit a bid
// ============================================================

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatIskAmount, getCategoryColor } from '@/lib/categories';
import type { BidRequest } from '@/types/database';
import { useSubmitBid } from '@/hooks/useServiceProvider';

const bidSchema = z.object({
  amount: z.coerce.number().positive('Upphæð þarf að vera jákvæð tala'),
  description: z.string().optional(),
  valid_until: z.date().optional(),
});

type BidFormValues = z.infer<typeof bidSchema>;

interface SubmitBidFormProps {
  open: boolean;
  onClose: () => void;
  bidRequest: BidRequest;
  providerId: string;
}

export function SubmitBidForm({ open, onClose, bidRequest, providerId }: SubmitBidFormProps) {
  const submitBid = useSubmitBid();
  const colors = getCategoryColor(bidRequest.category?.color);

  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      amount: undefined as unknown as number,
      description: '',
      valid_until: addDays(new Date(), 30),
    },
  });

  const onSubmit = async (values: BidFormValues) => {
    await submitBid.mutateAsync({
      bid_request_id: bidRequest.id,
      provider_id: providerId,
      amount: values.amount,
      description: values.description || undefined,
      valid_until: values.valid_until ? format(values.valid_until, 'yyyy-MM-dd') : undefined,
    });
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Senda tilboð</DialogTitle>
        </DialogHeader>

        {/* Bid request summary */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 border">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${colors.badge} text-xs border`}>
              {bidRequest.category?.name_is}
            </Badge>
            {bidRequest.deadline && (
              <span className="text-xs text-muted-foreground">
                Lokadagur: {format(new Date(bidRequest.deadline), 'dd. MMM yyyy')}
              </span>
            )}
          </div>
          <p className="text-sm font-medium">{bidRequest.title}</p>
          {bidRequest.description && (
            <p className="text-xs text-muted-foreground">{bidRequest.description}</p>
          )}
        </div>

        <Separator />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upphæð (kr.)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="t.d. 150000"
                        className="pr-10"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        kr.
                      </span>
                    </div>
                  </FormControl>
                  {field.value > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formatIskAmount(field.value)}
                    </p>
                  )}
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
                  <FormLabel>Lýsing (valfrjálst)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Lýstu tilboðinu nánar, hvað er innifalið..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valid until */}
            <FormField
              control={form.control}
              name="valid_until"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tilboð gildir til</FormLabel>
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
              <Button type="submit" disabled={submitBid.isPending}>
                {submitBid.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Senda tilboð
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
