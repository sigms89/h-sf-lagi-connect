// ============================================================
// Húsfélagið.is — Upload Transactions Component
// Performance-optimized: pagination, chunked processing, test mode
// Includes duplicate detection before saving
// ============================================================

import { useState, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Upload, ClipboardPaste, FileText, CheckCircle2, AlertTriangle,
  TrendingUp, TrendingDown, Loader2, X, ChevronLeft, ChevronRight, Info, Copy,
} from 'lucide-react';
import { parseTransactionText, parseJsonTransactions, formatDateIs, type ParsedTransaction } from '@/lib/parseTransactions';
import { categorizeTransaction } from '@/lib/categorize';
import { getCategoryColor, getCategoryHex, formatIskAmount } from '@/lib/categories';
import { useCategories, useVendorRules } from '@/hooks/useCategories';
import { useUploadTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/integrations/supabase/db';
import { format, subDays } from 'date-fns';
import type { TransactionInsert } from '@/types/database';

// ============================================================
// TYPES & CONSTANTS
// ============================================================
const PAGE_SIZE = 100;
const LARGE_DATASET_THRESHOLD = 500;
const CHUNK_SIZE = 400;

interface EnrichedTransaction extends ParsedTransaction {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  isIncome: boolean;
  isUncategorized: boolean;
  isIndividualPayment: boolean;
  isDuplicate?: boolean;
}

interface UploadTransactionsProps {
  associationId: string;
  onSuccess?: () => void;
  /** When true, "save to DB" is hidden — only preview/analysis */
  testModeDefault?: boolean;
}

export function UploadTransactions({ associationId, onSuccess, testModeDefault = false }: UploadTransactionsProps) {
  const { user } = useAuth();
  const { data: categories = [] } = useCategories();
  const { data: vendorRules = [] } = useVendorRules(associationId);
  const uploadMutation = useUploadTransactions();

  const [pasteText, setPasteText] = useState('');
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [enriched, setEnriched] = useState<EnrichedTransaction[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'csv' | 'xlsx' | 'paste' | 'json'>('paste');
  const [jsonText, setJsonText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);

  // Test mode
  const [testMode, setTestMode] = useState(testModeDefault);

  // Processing state for chunked parsing
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);

  // Inline editing row (for large datasets we only show Select for the active row)
  const [editingRow, setEditingRow] = useState<number | null>(null);

  // Duplicate detection state
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  const isLargeDataset = enriched.length > LARGE_DATASET_THRESHOLD;

  // ============================================================
  // ENRICH single transaction
  // ============================================================
  const enrichOne = useCallback(
    (tx: ParsedTransaction, hint?: string): EnrichedTransaction => {
      const result = categorizeTransaction(tx.description, tx.amount, vendorRules, categories);
      const cat = categories.find((c) => c.name_is === result.categoryNameIs);
      let enrichedTx: EnrichedTransaction = {
        ...tx,
        categoryId: cat?.id ?? null,
        categoryName: result.categoryNameIs,
        categoryColor: cat?.color ?? 'yellow',
        isIncome: result.isIncome,
        isUncategorized: result.categoryNameIs === 'Óflokkað' || result.method === 'fallback',
        isIndividualPayment: result.isIndividualPayment,
      };
      if (hint) {
        const hintCat = categories.find(
          (c) => c.name_is.toLowerCase() === hint.toLowerCase() || c.name_en?.toLowerCase() === hint.toLowerCase()
        );
        if (hintCat) {
          enrichedTx = {
            ...enrichedTx,
            categoryId: hintCat.id,
            categoryName: hintCat.name_is,
            categoryColor: hintCat.color ?? 'yellow',
            isUncategorized: false,
          };
        }
      }
      return enrichedTx;
    },
    [categories, vendorRules]
  );

  // ============================================================
  // CHUNKED ASYNC ENRICHMENT — keeps UI responsive
  // ============================================================
  const enrichChunked = useCallback(
    async (transactions: ParsedTransaction[], hints?: (string | undefined)[]): Promise<EnrichedTransaction[]> => {
      if (transactions.length <= CHUNK_SIZE) {
        // Small enough to do synchronously
        return transactions.map((tx, i) => enrichOne(tx, hints?.[i]));
      }
      setIsProcessing(true);
      setProcessProgress(0);
      const results: EnrichedTransaction[] = [];
      for (let i = 0; i < transactions.length; i += CHUNK_SIZE) {
        const chunk = transactions.slice(i, i + CHUNK_SIZE);
        const enrichedChunk = chunk.map((tx, j) => enrichOne(tx, hints?.[i + j]));
        results.push(...enrichedChunk);
        setProcessProgress(Math.round((results.length / transactions.length) * 100));
        // Yield to UI
        await new Promise((r) => setTimeout(r, 0));
      }
      setIsProcessing(false);
      setProcessProgress(100);
      return results;
    },
    [enrichOne]
  );

  // ============================================================
  // PARSE helpers
  // ============================================================
  const finishParse = (txs: EnrichedTransaction[], errors: string[], type: 'paste' | 'csv' | 'xlsx' | 'json', warns: string[] = []) => {
    setParseWarnings(warns);
    // If zero transactions AND there are errors, stay on input (don't go to empty preview)
    if (txs.length === 0 && errors.length > 0) {
      setParseErrors(errors);
      // Don't set isParsed — keep user on input screen
      return;
    }
    setEnriched(txs);
    setParseErrors(errors);
    setIsParsed(true);
    setFileType(type);
    setCurrentPage(0);
    setEditingRow(null);
    // Clear raw text to free memory
    if (type === 'paste') setPasteText('');
    if (type === 'json') setJsonText('');
  };

  const handleParse = async () => {
    try {
      const result = parseTransactionText(pasteText);
      const enrichedTx = await enrichChunked(result.transactions);
      finishParse(enrichedTx, result.errors.map((e) => `Lína ${e.line}: ${e.message}`), 'paste');
    } catch (err) {
      setParseErrors([`Villa: ${err instanceof Error ? err.message : 'Óþekkt villa'}`]);
      setEnriched([]);
      setIsParsed(true);
    }
  };

  const handleParseJson = async () => {
    setParseErrors([]);
    setParseWarnings([]);
    try {
      const result = parseJsonTransactions(jsonText);
      const warns = result.warnings ?? [];
      const errorMsgs = result.errors.map((e) => `Lína ${e.line}: ${e.message}`);
      if (result.transactions.length === 0 && result.errors.length > 0) {
        finishParse([], errorMsgs, 'json', warns);
        return;
      }
      const hints = result.transactions.map(
        (tx) => (tx as ParsedTransaction & { categoryHint?: string }).categoryHint
      );
      const enrichedTx = await enrichChunked(result.transactions, hints);
      finishParse(enrichedTx, errorMsgs, 'json', warns);
    } catch (err) {
      setParseErrors([`Villa við að lesa JSON: ${err instanceof Error ? err.message : 'Óþekkt villa'}`]);
    }
  };

  // ============================================================
  // FILE UPLOAD
  // ============================================================
  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      const isJson = file.name.endsWith('.json');
      const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      const type = isJson ? 'json' : isXlsx ? 'xlsx' : 'csv';
      setFileType(type);

      if (isXlsx) {
        // Binary xlsx — use SheetJS parser
        (async () => {
          try {
            const { parseXlsxFile } = await import('@/lib/xlsxParser');
            const result = await parseXlsxFile(file);
            const enrichedTx = await enrichChunked(result.transactions);
            finishParse(
              enrichedTx,
              result.errors.map((err) => `Lína ${err.line}: ${err.message}`),
              'xlsx',
              result.warnings ?? []
            );
          } catch (err) {
            setParseErrors([`Villa við xlsx lestur: ${err instanceof Error ? err.message : 'Óþekkt villa'}`]);
            setEnriched([]);
            setIsParsed(true);
          }
        })();
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        try {
          if (isJson) {
            setJsonText(text);
            const result = parseJsonTransactions(text);
            const hints = result.transactions.map(
              (tx) => (tx as ParsedTransaction & { categoryHint?: string }).categoryHint
            );
            const enrichedTx = await enrichChunked(result.transactions, hints);
            finishParse(enrichedTx, result.errors.map((err) => `Lína ${err.line}: ${err.message}`), 'json');
          } else {
            const result = parseTransactionText(text);
            const enrichedTx = await enrichChunked(result.transactions);
            finishParse(enrichedTx, result.errors.map((err) => `Lína ${err.line}: ${err.message}`), type as 'csv' | 'xlsx');
          }
        } catch (err) {
          setParseErrors([`Villa: ${err instanceof Error ? err.message : 'Óþekkt villa'}`]);
          setEnriched([]);
          setIsParsed(true);
        }
      };
      reader.readAsText(file, 'UTF-8');
    },
    [enrichChunked]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ============================================================
  // CHANGE CATEGORY INLINE
  // ============================================================
  const handleCategoryChange = (index: number, categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    setEnriched((prev) =>
      prev.map((tx, i) =>
        i === index
          ? {
              ...tx,
              categoryId,
              categoryName: cat?.name_is ?? 'Óflokkað',
              categoryColor: cat?.color ?? 'yellow',
              isUncategorized: cat?.name_is === 'Óflokkað',
            }
          : tx
      )
    );
    setEditingRow(null);
  };

  // ============================================================
  // DUPLICATE DETECTION
  // ============================================================
  const checkDuplicates = useCallback(async () => {
    if (!associationId || enriched.length === 0) return;
    setIsCheckingDuplicates(true);
    try {
      const ninetyDaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd');
      const { data: existing } = await db
        .from('transactions')
        .select('date, description, amount')
        .eq('association_id', associationId)
        .gte('date', ninetyDaysAgo)
        .limit(10000);

      if (!existing || existing.length === 0) {
        setIsCheckingDuplicates(false);
        return 0;
      }

      // Build a set of fingerprints from existing transactions
      const existingFingerprints = new Set(
        existing.map((t: any) => `${t.date}|${t.description?.trim()}|${t.amount}`)
      );

      // Mark duplicates on enriched transactions
      let dupes = 0;
      setEnriched((prev) =>
        prev.map((tx) => {
          const fingerprint = `${tx.date}|${tx.description.trim()}|${tx.amount}`;
          const isDup = existingFingerprints.has(fingerprint);
          if (isDup) dupes++;
          return { ...tx, isDuplicate: isDup };
        })
      );
      setDuplicateCount(dupes);
      setIsCheckingDuplicates(false);
      return dupes;
    } catch {
      setIsCheckingDuplicates(false);
      return 0;
    }
  }, [associationId, enriched.length]);

  // ============================================================
  // SAVE ALL
  // ============================================================
  const handleSave = async () => {
    if (!user || enriched.length === 0 || testMode) return;

    // Check for duplicates first
    const dupes = await checkDuplicates();
    if (dupes && dupes > 0) {
      setShowDuplicateWarning(true);
      return;
    }

    await doSave(enriched);
  };

  const doSave = async (txsToSave: EnrichedTransaction[]) => {
    if (!user || txsToSave.length === 0) return;

    const transactions: TransactionInsert[] = txsToSave.map((tx) => ({
      association_id: associationId,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      balance: tx.balance ?? null,
      category_id: tx.categoryId,
      is_income: tx.isIncome,
      is_individual_payment: tx.isIndividualPayment,
      original_description: tx.description,
      manually_categorized: false,
      categorized_by_user_id: null,
      notes: null,
      uploaded_batch_id: null,
    }));

    await uploadMutation.mutateAsync({
      associationId,
      transactions,
      uploadedBy: user.id,
      fileName: fileName || undefined,
      fileType,
    });

    setPasteText('');
    setJsonText('');
    setEnriched([]);
    setParseErrors([]);
    setIsParsed(false);
    setFileName('');
    setDuplicateCount(0);
    setShowDuplicateWarning(false);
    onSuccess?.();
  };

  const handleSaveSkippingDuplicates = async () => {
    setShowDuplicateWarning(false);
    const nonDuplicates = enriched.filter((tx) => !tx.isDuplicate);
    if (nonDuplicates.length === 0) {
      setIsParsed(false);
      setEnriched([]);
      return;
    }
    await doSave(nonDuplicates);
  };

  const handleSaveAll = async () => {
    setShowDuplicateWarning(false);
    await doSave(enriched);
  };

  // ============================================================
  // STATS — computed once via useMemo
  // ============================================================
  const stats = useMemo(() => {
    let incomeCount = 0, expenseCount = 0, totalIncome = 0, totalExpenses = 0, uncategorizedCount = 0;
    for (const tx of enriched) {
      if (tx.isIncome) {
        incomeCount++;
        totalIncome += Math.abs(tx.amount);
      } else {
        expenseCount++;
        totalExpenses += Math.abs(tx.amount);
      }
      if (tx.isUncategorized) uncategorizedCount++;
    }
    return { incomeCount, expenseCount, totalIncome, totalExpenses, uncategorizedCount };
  }, [enriched]);

  // ============================================================
  // PAGINATION
  // ============================================================
  const totalPages = Math.max(1, Math.ceil(enriched.length / PAGE_SIZE));
  const pageStart = currentPage * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, enriched.length);
  const visibleRows = enriched.slice(pageStart, pageEnd);

  const uploadProgress = uploadMutation.isPending ? 50 : uploadMutation.isSuccess ? 100 : 0;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Processing overlay */}
      {isProcessing && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Greini færslur...</span>
            </div>
            <Progress value={processProgress} className="h-1.5" />
            <p className="text-xs text-muted-foreground">{processProgress}%</p>
          </CardContent>
        </Card>
      )}

      {!isParsed && !isProcessing ? (
        <Tabs defaultValue="paste">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="paste" className="flex items-center gap-2">
              <ClipboardPaste className="h-4 w-4" />
              Líma inn
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CSV skrá
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              JSON
            </TabsTrigger>
          </TabsList>

          {/* ---- PASTE TAB ---- */}
          <TabsContent value="paste">
            <Card>
              <CardHeader>
                <CardTitle>Líma inn bankafærslur</CardTitle>
                <CardDescription>
                  Opnaðu netbanka, veldu allar færslurnar og límdu þær inn hér.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Límdu bankafærslur hér...\n\nDæmi:\n23.02.2026\tRafmagnsreikningur HS Orka\t-45.188\t1.234.567`}
                  className="min-h-[200px] font-mono text-sm"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {pasteText.split('\n').filter((l) => l.trim()).length} línur
                  </span>
                  <Button onClick={handleParse} disabled={!pasteText.trim() || isProcessing}>
                    Greina færslur
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---- CSV TAB ---- */}
          <TabsContent value="csv">
            <Card>
              <CardHeader>
                <CardTitle>Hlaða upp CSV skrá</CardTitle>
                <CardDescription>
                  Sæktu CSV skrá úr netbanka og dragðu hana hingað.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  aria-label="Hlaða upp skrá"
                >
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">Dragðu .csv, .xlsx eða .json skrá hingað</p>
                  <p className="text-xs text-muted-foreground mt-1">eða smelltu til að velja skrá</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---- JSON TAB ---- */}
          <TabsContent value="json">
            <Card>
              <CardHeader>
                <CardTitle>Líma inn JSON</CardTitle>
                <CardDescription>
                  Límdu JSON fylki af færslum. Hverjri færslu þarf date, description og amount.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder={`[\n  {\n    "date": "2026-02-23",\n    "description": "HS Orka",\n    "amount": -45188\n  }\n]`}
                  className="min-h-[200px] font-mono text-sm"
                />
                {/* Inline error display — keeps user on input */}
                {parseErrors.length > 0 && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-1">
                    <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                      <AlertTriangle className="h-4 w-4" />
                      Villa við JSON lestur
                    </div>
                    {parseErrors.slice(0, 3).map((e, i) => (
                      <p key={i} className="text-xs text-destructive/80">{e}</p>
                    ))}
                    <p className="text-xs text-muted-foreground mt-1">
                      Athugaðu hvort JSON-ið sé klippt eða vantar lokun (] eða {'}'}).
                      Þú getur líka hlaðið upp .json skránni í CSV flipanum.
                    </p>
                  </div>
          )}

          {/* Parse warnings (partial recovery) */}
          {parseWarnings.length > 0 && (
            <Card className="border-yellow-300 bg-yellow-50/60">
              <CardContent className="pt-3 pb-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  {parseWarnings.map((w, i) => (
                    <p key={i} className="text-xs text-yellow-800">{w}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">JSON færslur</span>
                  <Button onClick={handleParseJson} disabled={!jsonText.trim() || isProcessing}>
                    Greina JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : isParsed && (
        /* ============================================================
           PREVIEW TABLE — paginated
        ============================================================ */
        <div className="space-y-4">
          {/* Large dataset notice */}
          {isLargeDataset && (
            <Card className="border-blue-200 bg-blue-50/60">
              <CardContent className="pt-3 pb-3 flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800">
                  Stórt gagnasett ({enriched.length} færslur) · forskoðun er síðuð ({PAGE_SIZE} línur/síðu) til að halda appi hröðu. Smelltu á flokk til að breyta honum.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Stats summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Samtals færslur</p>
              <p className="text-2xl font-bold">{enriched.length}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-teal-600" /> Innkoma
              </p>
              <p className="text-lg font-semibold text-teal-600 tabular-nums">
                {formatIskAmount(stats.totalIncome)}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-rose-600" /> Útgjöld
              </p>
              <p className="text-lg font-semibold text-rose-600 tabular-nums">
                {formatIskAmount(stats.totalExpenses)}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-yellow-600" /> Óflokkað
              </p>
              <p className="text-2xl font-bold text-yellow-700">{stats.uncategorizedCount}</p>
            </Card>
          </div>

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  {parseErrors.length} línu(r) voru sleppt:
                </p>
                <ul className="text-xs text-yellow-700 space-y-0.5">
                  {parseErrors.slice(0, 5).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                  {parseErrors.length > 5 && (
                    <li>...og {parseErrors.length - 5} fleiri</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Upload progress */}
          {uploadMutation.isPending && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Hleð upp færslum...</p>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Transaction preview table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">
                  Forskoðun — {enriched.length} færslur
                  {testMode && (
                    <Badge variant="outline" className="ml-2 text-xs font-normal">Prófunarhamur</Badge>
                  )}
                </CardTitle>
                <div className="flex gap-2 items-center">
                  {/* Test mode toggle */}
                  <div className="flex items-center gap-1.5 mr-2">
                    <Switch
                      id="test-mode"
                      checked={testMode}
                      onCheckedChange={setTestMode}
                      className="scale-90"
                    />
                    <Label htmlFor="test-mode" className="text-xs text-muted-foreground cursor-pointer">
                      Prófa aðeins
                    </Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsParsed(false);
                      setEnriched([]);
                      setPasteText('');
                      setJsonText('');
                      setCurrentPage(0);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Hætta við
                  </Button>
                  {!testMode && (
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={uploadMutation.isPending || enriched.length === 0}
                    >
                      {uploadMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Hleð upp...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Vista {enriched.length} færslur
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.incomeCount} innkomur · {stats.expenseCount} útgjöld · {stats.uncategorizedCount} óflokkuð
                {enriched.length > PAGE_SIZE && (
                  <> · Síða {currentPage + 1} af {totalPages}</>
                )}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-center">#</TableHead>
                      <TableHead className="w-24">Dagsetning</TableHead>
                      <TableHead>Lýsing</TableHead>
                      <TableHead className="text-right w-28">Upphæð</TableHead>
                      <TableHead className="w-44">Flokkur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleRows.map((tx, i) => {
                      const globalIndex = pageStart + i;
                      const showSelect = !isLargeDataset || editingRow === globalIndex;
                      return (
                        <TableRow
                          key={globalIndex}
                          className={tx.isDuplicate ? 'bg-orange-50/80' : tx.isUncategorized ? 'bg-yellow-50/60' : undefined}
                        >
                          <TableCell className="text-xs text-muted-foreground text-center">
                            {globalIndex + 1}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                            {formatDateIs(tx.date)}
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px]">
                            <span className="truncate block" title={tx.description}>
                              {tx.description}
                            </span>
                            {tx.isDuplicate && (
                              <Badge variant="outline" className="text-[10px] mt-0.5 border-orange-300 text-orange-700 bg-orange-50">
                                <Copy className="h-2.5 w-2.5 mr-0.5" />
                                Tvítekning
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell
                            className={`text-right text-sm font-medium whitespace-nowrap ${
                              tx.isIncome ? 'text-teal-600' : 'text-rose-600'
                            }`}
                          >
                            {tx.isIncome ? '+' : '-'}
                            {formatIskAmount(Math.abs(tx.amount))}
                          </TableCell>
                          <TableCell>
                            {showSelect ? (
                              <Select
                                value={tx.categoryId ?? ''}
                                onValueChange={(val) => handleCategoryChange(globalIndex, val)}
                              >
                                <SelectTrigger className="h-7 text-xs border-0 shadow-none p-0 pl-1">
                                  <SelectValue>
                                    <Badge
                                      className={`text-xs ${getCategoryColor(tx.categoryColor).badge}`}
                                      variant="secondary"
                                    >
                                      {tx.isUncategorized && <AlertTriangle className="h-3 w-3 mr-1" />}
                                      {tx.categoryName}
                                    </Badge>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      <span className="flex items-center gap-2">
                                        <span
                                          className="inline-block w-2 h-2 rounded-full"
                                          style={{ backgroundColor: getCategoryHex(cat.color) }}
                                        />
                                        {cat.name_is}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <button
                                type="button"
                                className="text-left w-full"
                                onClick={() => setEditingRow(globalIndex)}
                              >
                                <Badge
                                  className={`text-xs cursor-pointer hover:opacity-80 ${getCategoryColor(tx.categoryColor).badge}`}
                                  variant="secondary"
                                >
                                  {tx.isUncategorized && <AlertTriangle className="h-3 w-3 mr-1" />}
                                  {tx.categoryName}
                                </Badge>
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Sýni {pageStart + 1}–{pageEnd} af {enriched.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 0}
                      onClick={() => { setCurrentPage((p) => p - 1); setEditingRow(null); }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground px-2">
                      {currentPage + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => { setCurrentPage((p) => p + 1); setEditingRow(null); }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Duplicate warning dialog */}
      <Dialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Tvíteknar færslur fundust
            </DialogTitle>
            <DialogDescription>
              {duplicateCount} af {enriched.length} færslum líta út fyrir að vera þegar í kerfinu
              (sama dagsetning, lýsing og upphæð). Hvað viltu gera?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDuplicateWarning(false)}>
              Hætta við
            </Button>
            <Button variant="secondary" onClick={handleSaveSkippingDuplicates}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Sleppa tvíteknum ({enriched.length - duplicateCount} færslur)
            </Button>
            <Button variant="destructive" onClick={handleSaveAll}>
              Vista allar ({enriched.length} færslur)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checking duplicates overlay */}
      {isCheckingDuplicates && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium">Athuga tvítekningar...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
