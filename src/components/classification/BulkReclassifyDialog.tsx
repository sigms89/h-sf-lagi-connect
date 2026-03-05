// ============================================================
// Húsfélagið.is — BulkReclassifyDialog
// Reusable dialog for reclassifying all transactions from a
// given vendor to a new category, with optional rule creation.
// ============================================================

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Tags, Sparkles } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useBulkReclassify } from '@/hooks/useClassification';
import { getCategoryColor, formatIskAmount } from '@/lib/categories';

// ============================================================
// PROPS
// ============================================================

export interface BulkReclassifyDialogProps {
  open: boolean;
  onClose: () => void;
  vendorName: string;
  transactionCount: number;
  totalAmount: number;
  currentCategoryId: string | null;
  /** Pre-fill the new category picker with a suggested category id */
  suggestedCategoryId?: string | null;
  associationId: string;
}

// ============================================================
// COMPONENT
// ============================================================

export function BulkReclassifyDialog({
  open,
  onClose,
  vendorName,
  transactionCount,
  totalAmount,
  currentCategoryId,
  suggestedCategoryId,
  associationId,
}: BulkReclassifyDialogProps) {
  const { data: categories = [] } = useCategories();
  const bulkReclassify = useBulkReclassify();

  const [newCategoryId, setNewCategoryId] = useState<string>(
    suggestedCategoryId ?? currentCategoryId ?? ''
  );
  const [createRule, setCreateRule] = useState(true);

  const isLoading = bulkReclassify.isPending;

  const selectedCategory = categories.find((c) => c.id === newCategoryId) ?? null;
  const currentCategory = categories.find((c) => c.id === currentCategoryId) ?? null;

  const handleConfirm = async () => {
    if (!newCategoryId) return;

    await bulkReclassify.mutateAsync({
      associationId,
      vendorName,
      newCategoryId,
      createRule,
    });

    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isLoading) onClose();
  };

  // Reset category selection when dialog opens with a new suggestion
  const handleCategoryChange = (val: string) => {
    setNewCategoryId(val);
  };

  const amountIsNegative = totalAmount < 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-[#0d9488]" />
            Endurmflokka færslur
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-1 pt-1">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{transactionCount}</span> færslur frá{' '}
                <span className="font-medium text-foreground truncate" title={vendorName}>
                  {vendorName}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Samtals:{' '}
                <span
                  className={`font-medium ${
                    amountIsNegative ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {amountIsNegative ? '-' : '+'}
                  {formatIskAmount(Math.abs(totalAmount))}
                </span>
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="space-y-5 py-2">
          {/* Current category info */}
          {currentCategory && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Núverandi flokkur:</span>
              <Badge
                variant="secondary"
                className={`text-xs ${getCategoryColor(currentCategory.color).badge}`}
              >
                {currentCategory.name_is}
              </Badge>
            </div>
          )}

          {/* Suggested category hint */}
          {suggestedCategoryId && suggestedCategoryId !== currentCategoryId && (
            <div className="flex items-start gap-2 rounded-md bg-teal-50 border border-teal-200 px-3 py-2 text-sm text-teal-800">
              <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0 text-teal-600" />
              <span>
                Kerfið leggur til:{' '}
                <strong>
                  {categories.find((c) => c.id === suggestedCategoryId)?.name_is ?? ''}
                </strong>
              </span>
            </div>
          )}

          {/* New category selector */}
          <div className="space-y-2">
            <Label htmlFor="new-category" className="text-sm font-medium">
              Nýr flokkur
            </Label>
            <Select value={newCategoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger id="new-category" className="w-full">
                {selectedCategory ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: getCategoryColor(selectedCategory.color).hex,
                      }}
                    />
                    <SelectValue />
                  </div>
                ) : (
                  <SelectValue placeholder="Veldu flokk..." />
                )}
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(cat.color).hex }}
                      />
                      {cat.name_is}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Create rule checkbox */}
          <div className="flex items-start gap-3 rounded-md border bg-muted/30 px-3 py-3">
            <Checkbox
              id="create-rule"
              checked={createRule}
              onCheckedChange={(checked) => setCreateRule(checked === true)}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <Label
                htmlFor="create-rule"
                className="text-sm font-medium cursor-pointer leading-snug"
              >
                Búa til sjálfvirka reglu
              </Label>
              <p className="text-xs text-muted-foreground leading-snug">
                Nýjar færslur frá þessum aðila flokkast sjálfkrafa í þennan flokk
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Hætta við
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!newCategoryId || isLoading}
            className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Endurflokka...
              </>
            ) : (
              <>
                <Tags className="h-4 w-4 mr-2" />
                Staðfesta ({transactionCount} færslur)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
