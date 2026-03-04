// ============================================================
// Húsfélagið.is — AdminNotifications
// Form to send system notification to associations
// ============================================================

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bell, Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { useSendNotification } from '@/hooks/useAdmin';
import type { NotificationPayload } from '@/hooks/useAdmin';

const notificationSchema = z.object({
  title: z.string().min(3, 'Titill þarf að vera að minnsta kosti 3 stafir'),
  message: z.string().min(10, 'Skilaboð þurfa að vera að minnsta kosti 10 stafir'),
  target: z.enum(['all', 'free', 'plus', 'pro']),
});

type FormValues = z.infer<typeof notificationSchema>;

const TARGET_LABELS: Record<string, string> = {
  all: 'Öll húsfélög',
  free: 'Frí áskrift',
  plus: 'Plus áskrift',
  pro: 'Pro áskrift',
};

export function AdminNotifications() {
  const sendNotification = useSendNotification();

  const form = useForm<FormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      message: '',
      target: 'all',
    },
  });

  const onSubmit = async (values: FormValues) => {
    await sendNotification.mutateAsync(values as NotificationPayload);
    form.reset();
  };

  const target = form.watch('target');

  return (
    <div className="max-w-lg space-y-4">
      <p className="text-sm text-muted-foreground">
        Sendu kerfistilkynningu til húsfélaga. Tilkynningin birtist á mælaborði hvers notanda.
      </p>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Ný tilkynning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Target */}
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Markhópur</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Öll húsfélög</SelectItem>
                        <SelectItem value="free">Frí áskrift</SelectItem>
                        <SelectItem value="plus">Plus áskrift</SelectItem>
                        <SelectItem value="pro">Pro áskrift</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Tilkynningin verður send til: {TARGET_LABELS[target]}
                    </FormDescription>
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
                      <Input placeholder="t.d. Viðhald á kerfi fimmtudaginn" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Message */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skilaboð</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Skrifaðu skilaboð hér..."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={sendNotification.isPending} className="gap-2">
                {sendNotification.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Senda tilkynningu
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
