// ============================================================
// Húsfélagið.is — VendorRuleManager
// Admin: manage global vendor classification rules
// ============================================================

import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useGlobalVendorRules,
  usePendingVendorRules,
  useCreateVendorRule,
  useUpdateVendorRule,
  useDeleteVendorRule,
} from '@/hooks/useAdmin';
import { getCategoryColor } from '@/lib/categories';
import { useCategories } from '@/hooks/useCategories';
import type { VendorRule } from '@/types/database';

const ruleSchema = z.object({
  keyword_pattern: z.string().min(2, 'Leitarmynstur þarf að vera að minnsta kosti 2 stafir'),
  category_id: z.string().min(1, 'Veldu flokk'),
  priority: z.coerce.number().int().min(1).max(100),
  is_global: z.boolean(),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

interface RuleFormDialogProps {
  open: boolean;
  onClose: () => void;
  defaultValues?: Partial<RuleFormValues>;
  ruleId?: string;
}

function RuleFormDialog({ open, onClose, defaultValues, ruleId }: RuleFormDialogProps) {
  const { data: categories = [] } = useCategories();
  const createRule = useCreateVendorRule();
  const updateRule = useUpdateVendorRule();

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      keyword_pattern: '',
      category_id: '',
      priority: 50,
      is_global: true,
      ...defaultValues,
    },
  });

  const onSubmit = async (values: RuleFormValues) => {
    if (ruleId) {
      await updateRule.mutateAsync({ id: ruleId, updates: values });
    } else {
      await createRule.mutateAsync(values as Required<RuleFormValues>);
    }
    onClose();
  };

  const isPending = createRule.isPending || updateRule.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{ruleId ? 'Breyta reglu' : 'Ný flokkunarregla'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="keyword_pattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leitarmynstur</FormLabel>
                  <FormControl>
                    <Input placeholder="t.d. RAFEINDATAE" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flokkur</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Veldu flokk" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name_is}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forgangur (1–100)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Hætta við</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {ruleId ? 'Vista breytingar' : 'Stofna reglu'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function RulesTable({
  rules,
  isLoading,
  onEdit,
  onDelete,
}: {
  rules: VendorRule[];
  isLoading: boolean;
  onEdit: (rule: VendorRule) => void;
  onDelete: (id: string) => void;
}) {
  const deleteRule = useDeleteVendorRule();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
        Engar reglur skráðar.
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>Leitarmynstur</TableHead>
            <TableHead>Flokkur</TableHead>
            <TableHead>Forgangur</TableHead>
            <TableHead className="hidden md:table-cell">Stofnað</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => {
            const colors = getCategoryColor(rule.category?.color);
            return (
              <TableRow key={rule.id}>
                <TableCell className="font-mono text-xs">{rule.keyword_pattern}</TableCell>
                <TableCell>
                  {rule.category ? (
                    <Badge className={`${colors.badge} text-xs border`}>
                      {rule.category.name_is}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="tabular-nums text-sm">{rule.priority}</TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                  {format(new Date(rule.created_at), 'dd.MM.yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => onEdit(rule)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => deleteRule.mutate(rule.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function VendorRuleManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<VendorRule | null>(null);

  const { data: globalRules = [], isLoading: isLoadingGlobal } = useGlobalVendorRules();
  const { data: pendingRules = [], isLoading: isLoadingPending } = usePendingVendorRules();
  const deleteRule = useDeleteVendorRule();

  const handleEdit = (rule: VendorRule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRule(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Alþjóðlegar reglur sem gilda um öll húsfélög.
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Ný regla
        </Button>
      </div>

      <Tabs defaultValue="global">
        <TabsList>
          <TabsTrigger value="global">
            Alþjóðlegar reglur ({globalRules.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Tillögur frá húsfélögum
            {pendingRules.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                {pendingRules.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-4">
          <RulesTable
            rules={globalRules}
            isLoading={isLoadingGlobal}
            onEdit={handleEdit}
            onDelete={(id) => deleteRule.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <RulesTable
            rules={pendingRules}
            isLoading={isLoadingPending}
            onEdit={handleEdit}
            onDelete={(id) => deleteRule.mutate(id)}
          />
        </TabsContent>
      </Tabs>

      {showForm && (
        <RuleFormDialog
          open={showForm}
          onClose={handleCloseForm}
          ruleId={editingRule?.id}
          defaultValues={
            editingRule
              ? {
                  keyword_pattern: editingRule.keyword_pattern,
                  category_id: editingRule.category_id,
                  priority: editingRule.priority,
                  is_global: editingRule.is_global,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
