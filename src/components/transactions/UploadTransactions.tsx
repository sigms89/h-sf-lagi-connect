// ============================================================
// Húsfélagið.is — Upload Transactions Component
// Tab interface: paste | CSV file upload
// ============================================================

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  ClipboardPaste,
  FileText,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Loader2,
  X,
} from 'lucide-react';
import { parseTransactionText, parseJsonTransactions, formatDateIs, type ParsedTransaction } from '@/lib/parseTransactions';
import { categorizeTransaction } from '@/lib/categorize';
import { getCategoryColor, getCategoryHex, formatIskAmount } from '@/lib/categories';
import { useCategories, useVendorRules } from '@/hooks/useCategories';
import { useUploadTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import type { TransactionInsert } from '@/types/database';

interface EnrichedTransaction extends ParsedTransaction {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  isIncome: boolean;
  isUncategorized: boolean;
  isIndividualPayment: boolean;
}

interface UploadTransactionsProps {
  associationId: string;
  onSuccess?: () => void;
}

export function UploadTransactions({ associationId, onSuccess }: UploadTransactionsProps) {
  const { user } = useAuth();
  const { data: categories = [] } = useCategories();
  const { data: vendorRules = [] } = useVendorRules(associationId);
  const uploadMutation = useUploadTransactions();

  const [pasteText, setPasteText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [enriched, setEnriched] = useState<EnrichedTransaction[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<'csv' | 'xlsx' | 'paste' | 'json'>('paste');
  const [jsonText, setJsonText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // ENRICH with categorization
  // ============================================================
  const enrichTransactions = useCallback(
    (transactions: ParsedTransaction[]): EnrichedTransaction[] => {
      return transactions.map((tx) => {
        const result = categorizeTransaction(
          tx.description,
          tx.amount,
          vendorRules,
          categories
        );
        const cat = categories.find((c) => c.name_is === result.categoryNameIs);
        const isUncategorized = result.categoryNameIs === 'Óflokkað' || result.method === 'fallback';
        return {
          ...tx,
          categoryId: cat?.id ?? null,
          categoryName: result.categoryNameIs,
          categoryColor: cat?.color ?? 'yellow',
          isIncome: result.isIncome,
          isUncategorized,
          isIndividualPayment: result.isIndividualPayment,
        };
      });
    },
    [categories, vendorRules]
  );

  // ============================================================
  // PARSE PASTED TEXT
  // ============================================================
  const handleParse = () => {
    const result = parseTransactionText(pasteText);
    const enrichedTx = enrichTransactions(result.transactions);
    setEnriched(enrichedTx);
    setParseErrors(result.errors.map((e) => `Lína ${e.line}: ${e.message}`));
    setIsParsed(true);
    setFileType('paste');
  };

  // ============================================================
  // PARSE JSON TEXT
  // ============================================================
  const handleParseJson = () => {
    try {
      const result = parseJsonTransactions(jsonText);
      if (result.transactions.length === 0 && result.errors.length > 0) {
        setParseErrors(result.errors.map((e) => `Lína ${e.line}: ${e.message}`));
        setEnriched([]);
        setIsParsed(true);
        setFileType('json');
        return;
      }
      // If the JSON has a category hint, try to match it
      const enrichedTx = enrichTransactions(result.transactions).map((tx, i) => {
        const hint = (result.transactions[i] as ParsedTransaction & { categoryHint?: string }).categoryHint;
        if (hint) {
          const cat = categories.find(
            (c) => c.name_is.toLowerCase() === hint.toLowerCase() || c.name_en?.toLowerCase() === hint.toLowerCase()
          );
          if (cat) {
            return {
              ...tx,
              categoryId: cat.id,
              categoryName: cat.name_is,
              categoryColor: cat.color ?? 'yellow',
              isUncategorized: false,
            };
          }
        }
        return tx;
      });
      setEnriched(enrichedTx);
      setParseErrors(result.errors.map((e) => `Lína ${e.line}: ${e.message}`));
      setIsParsed(true);
      setFileType('json');
    } catch (err) {
      setParseErrors([`Villa við að lesa JSON: ${err instanceof Error ? err.message : 'Óþekkt villa'}`]);
      setEnriched([]);
      setIsParsed(true);
      setFileType('json');
    }
  };

  // ============================================================
  // FILE UPLOAD
  // ============================================================
  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      const isJson = file.name.endsWith('.json');
      const type = isJson ? 'json' : file.name.endsWith('.xlsx') ? 'xlsx' : 'csv';
      setFileType(type);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (isJson) {
          setJsonText(text);
          // Auto-parse JSON files
          const result = parseJsonTransactions(text);
          const enrichedTx = enrichTransactions(result.transactions).map((tx, i) => {
            const hint = (result.transactions[i] as ParsedTransaction & { categoryHint?: string }).categoryHint;
            if (hint) {
              const cat = categories.find(
                (c) => c.name_is.toLowerCase() === hint.toLowerCase() || c.name_en?.toLowerCase() === hint.toLowerCase()
              );
              if (cat) {
                return { ...tx, categoryId: cat.id, categoryName: cat.name_is, categoryColor: cat.color ?? 'yellow', isUncategorized: false };
              }
            }
            return tx;
          });
          setEnriched(enrichedTx);
          setParseErrors(result.errors.map((err) => `Lína ${err.line}: ${err.message}`));
          setIsParsed(true);
        } else {
          const result = parseTransactionText(text);
          const enrichedTx = enrichTransactions(result.transactions);
          setEnriched(enrichedTx);
          setParseErrors(result.errors.map((err) => `Lína ${err.line}: ${err.message}`));
          setIsParsed(true);
        }
      };
      reader.readAsText(file, 'UTF-8');
    },
    [enrichTransactions, categories]
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
  };

  // ============================================================
  // SAVE ALL
  // ============================================================
  const handleSave = async () => {
    if (!user || enriched.length === 0) return;

    const transactions: TransactionInsert[] = enriched.map((tx) => ({
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
      uploaded_batch_id: null, // Will be set by the hook
    }));

    await uploadMutation.mutateAsync({
      associationId,
      transactions,
      uploadedBy: user.id,
      fileName: fileName || undefined,
      fileType,
    });

    // Reset
    setPasteText('');
    setJsonText('');
    setEnriched([]);
    setParseErrors([]);
    setIsParsed(false);
    setFileName('');
    onSuccess?.();
  };

  // ============================================================
  // STATS
  // ============================================================
  const uncategorizedCount = enriched.filter((t) => t.isUncategorized).length;
  const incomeCount = enriched.filter((t) => t.isIncome).length;
  const expenseCount = enriched.filter((t) => !t.isIncome).length;
  const totalIncome = enriched.filter((t) => t.isIncome).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalExpenses = enriched.filter((t) => !t.isIncome).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const uploadProgress = uploadMutation.isPending ? 50 : uploadMutation.isSuccess ? 100 : 0;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      {!isParsed ? (
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
                  Opnaðu netbanka, veldu allar færslurnar og límdu þær inn hér. Kerfið sér sjálfkrafa um dálkaskiptingu.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Límdu bankafærslur hér...\n\nDæmi:\n23.02.2026\tRafmagnsreikningur HS Orka\t-45.188\t1.234.567\n15.02.2026\tJón Jónsson\t15.000\t1.279.755`}
                  className="min-h-[200px] font-mono text-sm"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {pasteText.split('\n').filter((l) => l.trim()).length} línur
                  </span>
                  <Button onClick={handleParse} disabled={!pasteText.trim()}>
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
                  Sæktu CSV skrá úr netbanka og dragðu hana hingað. Stutt er við UTF-8 skrár með íslenskum stöfum.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    dragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
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
                  <p className="text-sm font-medium">
                    Dragðu .csv, .xlsx eða .json skrá hingað
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    eða smelltu til að velja skrá
                  </p>
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
                  Límdu JSON fylki af færslum. Hverjri færslu þarf date, description og amount. Einnig má hafa balance og category.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder={`[\n  {\n    "date": "2026-02-23",\n    "description": "HS Orka",\n    "amount": -45188,\n    "balance": 176383,\n    "category": "Rafmagn & Hiti"\n  }\n]`}
                  className="min-h-[200px] font-mono text-sm"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    JSON færslur
                  </span>
                  <Button onClick={handleParseJson} disabled={!jsonText.trim()}>
                    Greina JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        /* ============================================================
           PREVIEW TABLE
        ============================================================ */
        <div className="space-y-4">
          {/* Stats summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Samtals færslur</p>
              <p className="text-2xl font-bold">{enriched.length}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" /> Innkoma
              </p>
              <p className="text-lg font-semibold text-green-600">
                {formatIskAmount(totalIncome)}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-red-600" /> Útgjöld
              </p>
              <p className="text-lg font-semibold text-red-600">
                {formatIskAmount(totalExpenses)}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-yellow-600" /> Óflokkað
              </p>
              <p className="text-2xl font-bold text-yellow-700">{uncategorizedCount}</p>
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Forskoðun — {enriched.length} færslur</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsParsed(false);
                      setEnriched([]);
                      setPasteText('');
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Hætta við
                  </Button>
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
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {incomeCount} innkomur · {expenseCount} útgjöld · {uncategorizedCount} óflokkuð
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Dagsetning</TableHead>
                      <TableHead>Lýsing</TableHead>
                      <TableHead className="text-right w-28">Upphæð</TableHead>
                      <TableHead className="w-44">Flokkur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enriched.map((tx, index) => (
                      <TableRow
                        key={index}
                        className={tx.isUncategorized ? 'bg-yellow-50/60' : undefined}
                      >
                        <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                          {formatDateIs(tx.date)}
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px]">
                          <span className="truncate block" title={tx.description}>
                            {tx.description}
                          </span>
                        </TableCell>
                        <TableCell
                          className={`text-right text-sm font-medium whitespace-nowrap ${
                            tx.isIncome ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {tx.isIncome ? '+' : '-'}
                          {formatIskAmount(Math.abs(tx.amount))}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={tx.categoryId ?? ''}
                            onValueChange={(val) => handleCategoryChange(index, val)}
                          >
                            <SelectTrigger className="h-7 text-xs border-0 shadow-none p-0 pl-1">
                              <SelectValue>
                                <Badge
                                  className={`text-xs ${getCategoryColor(tx.categoryColor).badge}`}
                                  variant="secondary"
                                >
                                  {tx.isUncategorized && (
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                  )}
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
