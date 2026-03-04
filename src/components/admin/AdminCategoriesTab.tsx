// ============================================================
// Húsfélagið.is — AdminCategoriesTab (NEW)
// Full CRUD for categories table + merge categories feature
// Create / Edit / Delete / Merge via dialogs
// ============================================================

import { useState } from 'react';
import { Plus, Pencil, Trash2, GitMerge, FolderOpen, Shield } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Category } from '@/types/database';
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useMergeCategories,
  type CategoryInsert,
} from '@/hooks/useAdminExtended';

// ============================================================
// EMPTY FORM STATE
// ============================================================

const EMPTY_FORM: CategoryInsert = {
  name_is: '',
  name_en: '',
  icon: '',
  color: '#6b7280',
  is_system: false,
  parent_category_id: null,
};

// ============================================================
// CategoryForm — shared between create and edit dialogs
// ============================================================

interface CategoryFormProps {
  value: CategoryInsert;
  onChange: (v: CategoryInsert) => void;
  categories: Category[];
  excludeId?: string;
}

function CategoryForm({ value, onChange, categories, excludeId }: CategoryFormProps) {
  const parentOptions = categories.filter(
    (c) => c.id !== excludeId && !c.parent_category_id
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">Nafn (IS) *</label>
          <Input
            value={value.name_is}
            onChange={(e) => onChange({ ...value, name_is: e.target.value })}
            placeholder="Heiti á íslensku"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Nafn (EN)</label>
          <Input
            value={value.name_en ?? ''}
            onChange={(e) => onChange({ ...value, name_en: e.target.value || null })}
            placeholder="Name in English"
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">Tákn (emoji)</label>
          <Input
            value={value.icon ?? ''}
            onChange={(e) => onChange({ ...value, icon: e.target.value || null })}
            placeholder="🏠"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Litur</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={value.color ?? '#6b7280'}
              onChange={(e) => onChange({ ...value, color: e.target.value })}
              className="h-8 w-10 rounded border cursor-pointer p-0.5"
            />
            <Input
              value={value.color ?? ''}
              onChange={(e) => onChange({ ...value, color: e.target.value || null })}
              placeholder="#6b7280"
              className="h-8 text-xs flex-1"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Yfirflokkur</label>
        <Select
          value={value.parent_category_id ?? 'none'}
          onValueChange={(v) =>
            onChange({ ...value, parent_category_id: v === 'none' ? null : v })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Enginn yfirflokkur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Enginn yfirflokkur</SelectItem>
            {parentOptions.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ''}{c.name_is}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_system"
          type="checkbox"
          checked={value.is_system}
          onChange={(e) => onChange({ ...value, is_system: e.target.checked })}
          className="h-3.5 w-3.5 rounded"
        />
        <label htmlFor="is_system" className="text-xs font-medium cursor-pointer">
          Kerfisflokkur (vernda gegn eyðingu af notendum)
        </label>
      </div>
    </div>
  );
}

// ============================================================
// AdminCategoriesTab
// ============================================================

export function AdminCategoriesTab() {
  const { data: categories = [], isLoading } = useAdminCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const mergeCategories = useMergeCategories();

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CategoryInsert>(EMPTY_FORM);

  // Edit dialog
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState<CategoryInsert>(EMPTY_FORM);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // Merge dialog
  const [showMerge, setShowMerge] = useState(false);
  const [mergeSource, setMergeSource] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');

  // ---- Handlers ----

  function openEdit(cat: Category) {
    setEditTarget(cat);
    setEditForm({
      name_is: cat.name_is,
      name_en: cat.name_en,
      icon: cat.icon,
      color: cat.color,
      is_system: cat.is_system,
      parent_category_id: cat.parent_category_id,
    });
  }

  async function handleCreate() {
    if (!createForm.name_is.trim()) return;
    await createCategory.mutateAsync(createForm);
    setShowCreate(false);
    setCreateForm(EMPTY_FORM);
  }

  async function handleEdit() {
    if (!editTarget || !editForm.name_is.trim()) return;
    await updateCategory.mutateAsync({ id: editTarget.id, ...editForm });
    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteCategory.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }

  async function handleMerge() {
    if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) return;
    await mergeCategories.mutateAsync({ sourceId: mergeSource, targetId: mergeTarget });
    setShowMerge(false);
    setMergeSource('');
    setMergeTarget('');
  }

  // ---- Helpers ----

  function parentName(id: string | null): string {
    if (!id) return '—';
    return categories.find((c) => c.id === id)?.name_is ?? '—';
  }

  return (
    <>
      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Nýr flokkur</DialogTitle>
            <DialogDescription className="text-xs">
              Stofnaðu nýjan flokk í kerfið
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            value={createForm}
            onChange={setCreateForm}
            categories={categories}
          />
          <DialogFooter>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => setShowCreate(false)}
            >
              Hætta við
            </Button>
            <Button
              size="sm"
              className="text-xs"
              onClick={handleCreate}
              disabled={!createForm.name_is.trim() || createCategory.isPending}
            >
              {createCategory.isPending ? 'Vista...' : 'Vista'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Breyta flokki</DialogTitle>
          </DialogHeader>
          <CategoryForm
            value={editForm}
            onChange={setEditForm}
            categories={categories}
            excludeId={editTarget?.id}
          />
          <DialogFooter>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => setEditTarget(null)}
            >
              Hætta við
            </Button>
            <Button
              size="sm"
              className="text-xs"
              onClick={handleEdit}
              disabled={!editForm.name_is.trim() || updateCategory.isPending}
            >
              {updateCategory.isPending ? 'Vista...' : 'Vista'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Eyða flokki?</DialogTitle>
            <DialogDescription className="text-xs">
              Þetta eyðir flokk <strong>{deleteTarget?.name_is}</strong> varanlega. Ef
              færslur vísa í þennan flokk mun eyðing mistakast. Notaðu sameininguna til að
              flytja færslur fyrst.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => setDeleteTarget(null)}
            >
              Hætta við
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="text-xs"
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending ? 'Eyðir...' : 'Eyða'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={showMerge} onOpenChange={setShowMerge}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Sameina flokka</DialogTitle>
            <DialogDescription className="text-xs">
              Allar færslur og flokkareglur færast úr upprunalegum flokk yfir í markflokk.
              Upprunalegur flokkur verður síðan eytt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Upprunalegur flokkur (verður eytt)</label>
              <Select value={mergeSource} onValueChange={setMergeSource}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Veldu flokk..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} disabled={c.id === mergeTarget}>
                      {c.icon ? `${c.icon} ` : ''}{c.name_is}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Markflokkur (færslur flytjast hingað)</label>
              <Select value={mergeTarget} onValueChange={setMergeTarget}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Veldu flokk..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} disabled={c.id === mergeSource}>
                      {c.icon ? `${c.icon} ` : ''}{c.name_is}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => setShowMerge(false)}
            >
              Hætta við
            </Button>
            <Button
              size="sm"
              className="text-xs"
              onClick={handleMerge}
              disabled={
                !mergeSource ||
                !mergeTarget ||
                mergeSource === mergeTarget ||
                mergeCategories.isPending
              }
            >
              {mergeCategories.isPending ? 'Sameina...' : 'Sameina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base">Flokkar</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {isLoading ? 'Hleður...' : `${categories.length} flokkar`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5"
                onClick={() => setShowMerge(true)}
              >
                <GitMerge className="h-3.5 w-3.5" />
                Sameina
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => {
                  setCreateForm(EMPTY_FORM);
                  setShowCreate(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Nýr flokkur
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-9 rounded" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Engir flokkar skráðir</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-8">Tákn</TableHead>
                  <TableHead className="text-xs">Nafn (IS)</TableHead>
                  <TableHead className="text-xs">Nafn (EN)</TableHead>
                  <TableHead className="text-xs w-16">Litur</TableHead>
                  <TableHead className="text-xs w-32">Yfirflokkur</TableHead>
                  <TableHead className="text-xs w-28">Tegund</TableHead>
                  <TableHead className="text-xs w-20 text-right">Aðgerðir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="text-base text-center">
                      {cat.icon ?? ''}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{cat.name_is}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {cat.name_en ?? '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {cat.color && (
                          <div
                            className="w-4 h-4 rounded-full border border-border flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                        )}
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {cat.color ?? '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {parentName(cat.parent_category_id)}
                    </TableCell>
                    <TableCell>
                      {cat.is_system ? (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                          <Shield className="h-2.5 w-2.5" />
                          Kerfisflokkur
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Notandaflokkur
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => openEdit(cat)}
                          title="Breyta"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(cat)}
                          title="Eyða"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
