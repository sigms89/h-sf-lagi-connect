interface Props { providerId: string; }

export function MyBids({ providerId }: Props) {
  return <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Mín tilboð — kemur fljótlega</p></div>;
}
