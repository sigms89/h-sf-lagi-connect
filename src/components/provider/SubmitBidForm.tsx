import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import type { BidRequest } from '@/types/database';
import { useSubmitBid } from '@/hooks/useServiceProvider';

const bidSchema = z.object({
  amount: z.coerce.number().min(1, 'Upphæð þarf að vera stærri en 0'),
  description: z.string().min(5, 'Lýsing þarf að vera að minnsta kosti 5 stafir'),
  valid_until: z.string().optional(),
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

  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      amount: 0,
      description: '',
      valid_until: '',
    },
  });

  const onSubmit = async (values: BidFormValues) => {
    await submitBid.mutateAsync({
      bid_request_id: bidRequest.id,
      provider_id: providerId,
      amount: values.amount,
      description: values.description,
      valid_until: values.valid_until || undefined,
    });
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Senda tilboð</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
          {bidRequest.title}
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upphæð (ISK)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lýsing á tilboði</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Lýstu tilboðinu..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="valid_until"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gildir til (valkvætt)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={submitBid.isPending} className="w-full gap-2">
              {submitBid.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Senda tilboð
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
