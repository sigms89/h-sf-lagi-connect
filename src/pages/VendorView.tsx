import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Store } from 'lucide-react';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useCurrentAssociation } from '@/hooks/useAssociation';
import { useVendorAggregation } from '@/hooks/useVendorAggregation';

function formatISK(amount: number) {
  const abs = Math.abs(Math.round(amount));
  const str = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${amount < 0 ? '-' : ''}${str} ISK`;
}

function formatDate(dateStr: string) {
  return format(new Date(dateStr), 'd. MMM yyyy', { locale: is });
}

export default function VendorView() {
  const { data: association } = useCurrentAssociation();
  const associationId = association?.id;
  const { data: vendors = [], isLoading, error } = useVendorAggregation(associationId);
  const [search, setSearch] = useState('');

  const filtered = vendors.filter((v) =>
    v.vendorName.toLowerCase().includes(search.toLowerCase())
  );

  const totalVendors = vendors.length;
  const totalSpend = vendors.reduce((s, v) => s + v.totalSpend, 0);
  const totalTransactions = vendors.reduce((s, v) => s + v.transactionCount, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Back link */}
      <Link
        to="/analytics"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Til baka í greiningu
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Store className="h-6 w-6 text-[#1e3a5f]" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Birgjar</h1>
          <p className="text-sm text-muted-foreground">
            Yfirlit yfir alla birgjasamninga og útgjöld
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Fjöldi birgja</p>
            <p className="text-2xl font-bold">{totalVendors}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">
              Heildarútgjöld til birgja
            </p>
            <p className="text-2xl font-bold">{formatISK(totalSpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">
              Heildarfærslur
            </p>
            <p className="text-2xl font-bold">{totalTransactions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Birgjalisti
          </CardTitle>
          <CardDescription>
            Smelltu á birgi til að sjá tengdar færslur
          </CardDescription>
          <div className="mt-2">
            <Input
              placeholder="Leita að birgi…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive p-4">
              Villa við að sækja birgja.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">
              Engir birgjar fundust.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Birgir</TableHead>
                  <TableHead className="text-right">Heildarútgjöld</TableHead>
                  <TableHead className="text-right">Færslur</TableHead>
                  <TableHead>Síðasta færsla</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((vendor) => (
                  <TableRow key={vendor.vendorId} className="group">
                    <TableCell className="font-medium">
                      {vendor.vendorName}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatISK(vendor.totalSpend)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {vendor.transactionCount}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(vendor.lastTransactionDate)}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/transactions?search=${encodeURIComponent(
                          vendor.vendorName
                        )}`}
                        className="inline-flex items-center gap-1 text-xs text-[#0d9488] hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Sjá færslur"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Færslur
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
