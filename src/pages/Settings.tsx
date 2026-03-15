// ============================================================
// Húsfélagið.is — Settings Page
// Association settings form + member management
// ============================================================

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, UserPlus, Trash2 } from 'lucide-react';
import { useCurrentAssociation, useUpdateAssociation } from '@/hooks/useAssociation';
import {
  useAssociationMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
} from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import type { MemberRole } from '@/types/database';

// ============================================================
// SCHEMAS
// ============================================================
const associationSchema = z.object({
  name: z.string().min(2, 'Nafn verður að vera að minnsta kosti 2 stafir'),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  city: z.string().optional(),
  num_units: z.number().int().min(1).max(999),
  type: z.enum(['fjolbyli', 'radhus', 'parhus']),
  building_year: z.number().int().min(1800).max(2030).optional().nullable(),
  has_elevator: z.boolean(),
  has_parking: z.boolean(),
  num_floors: z.number().int().min(1).max(50),
  square_meters_total: z.number().positive().optional().nullable(),
});

type AssociationFormData = z.infer<typeof associationSchema>;

const inviteSchema = z.object({
  email: z.string().email('Ógilt netfang'),
  role: z.enum(['admin', 'board', 'member']),
});

type InviteFormData = z.infer<typeof inviteSchema>;

// ============================================================
// ROLE LABELS
// ============================================================
const ROLE_LABELS: Record<MemberRole, string> = {
  admin: 'Formaður',
  board: 'Stjórnarsmeðlimur',
  member: 'Meðlimur',
};

const ROLE_COLORS: Record<MemberRole, string> = {
  admin: 'bg-blue-100 text-blue-800',
  board: 'bg-purple-100 text-purple-800',
  member: 'bg-gray-100 text-gray-800',
};

// ============================================================
// COMPONENT
// ============================================================
export default function Settings() {
  const { user } = useAuth();
  const { data: association, isLoading: assocLoading } = useCurrentAssociation();
  const { data: members = [], isLoading: membersLoading } = useAssociationMembers(association?.id);
  const updateAssoc = useUpdateAssociation();
  const inviteMember = useInviteMember();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const [inviteOpen, setInviteOpen] = useState(false);

  const form = useForm<AssociationFormData>({
    resolver: zodResolver(associationSchema),
    defaultValues: {
      name: '',
      address: '',
      postal_code: '',
      city: 'Reykjavík',
      num_units: 1,
      type: 'fjolbyli',
      building_year: null,
      has_elevator: false,
      has_parking: false,
      num_floors: 1,
      square_meters_total: null,
    },
  });

  const inviteForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'member' },
  });

  // Populate form when association loads
  useEffect(() => {
    if (association) {
      form.reset({
        name: association.name,
        address: association.address ?? '',
        postal_code: association.postal_code ?? '',
        city: association.city ?? 'Reykjavík',
        num_units: association.num_units,
        type: (association.type as 'fjolbyli' | 'radhus' | 'parhus') ?? 'fjolbyli',
        building_year: association.building_year ?? null,
        has_elevator: association.has_elevator,
        has_parking: association.has_parking,
        num_floors: association.num_floors,
        square_meters_total: association.square_meters_total ?? null,
      });
    }
  }, [association, form]);

  const onSubmit = async (data: AssociationFormData) => {
    if (!association) return;
    await updateAssoc.mutateAsync({ id: association.id, updates: data });
  };

  const onInvite = async (data: InviteFormData) => {
    if (!association || !user) return;
    await inviteMember.mutateAsync({
      email: data.email,
      associationId: association.id,
      role: data.role,
      invitedBy: user.id,
    });
    setInviteOpen(false);
    inviteForm.reset();
  };

  if (assocLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!association) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Ekkert húsfélag tengt. Vinsamlegast stofnaðu húsfélag fyrst.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Stillingar</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upplýsingar um húsfélagið og meðlimastjórnun
        </p>
      </div>

      {/* ============================================================
          ASSOCIATION SETTINGS FORM
      ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Upplýsingar um húsfélagið</CardTitle>
          <CardDescription>
            Grunnupplýsingar sem notaðar eru í greiningu og samanburði
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Nafn húsfélags *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="t.d. Húsfélag Laugavegar 12"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Address row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="address">Heimilisfang</Label>
                <Input
                  id="address"
                  {...form.register('address')}
                  placeholder="t.d. Laugavegur 12"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="postal_code">Póstnúmer</Label>
                <Input
                  id="postal_code"
                  {...form.register('postal_code')}
                  placeholder="101"
                />
              </div>
            </div>

            {/* City + Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">Bær / Borg</Label>
                <Input
                  id="city"
                  {...form.register('city')}
                  placeholder="Reykjavík"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tegund</Label>
                <Select
                  value={form.watch('type')}
                  onValueChange={(v) => form.setValue('type', v as 'fjolbyli' | 'radhus' | 'parhus')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fjolbyli">Fjölbýlishús</SelectItem>
                    <SelectItem value="radhus">Raðhús</SelectItem>
                    <SelectItem value="parhus">Parhús</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Units + Year + Floors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="num_units">Fjöldi íbúða *</Label>
                <Input
                  id="num_units"
                  type="number"
                  min={1}
                  {...form.register('num_units', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="building_year">Byggingarár</Label>
                <Input
                  id="building_year"
                  type="number"
                  placeholder="1975"
                  {...form.register('building_year', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="num_floors">Fjöldi hæða</Label>
                <Input
                  id="num_floors"
                  type="number"
                  min={1}
                  {...form.register('num_floors', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="square_meters_total">Fermetrar (samtals)</Label>
                <Input
                  id="square_meters_total"
                  type="number"
                  placeholder="2400"
                  {...form.register('square_meters_total', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  id="has_elevator"
                  checked={form.watch('has_elevator')}
                  onCheckedChange={(v) => form.setValue('has_elevator', v)}
                />
                <Label htmlFor="has_elevator">Lyfta</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="has_parking"
                  checked={form.watch('has_parking')}
                  onCheckedChange={(v) => form.setValue('has_parking', v)}
                />
                <Label htmlFor="has_parking">Bílastæði</Label>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={updateAssoc.isPending || !form.formState.isDirty}
              >
                {updateAssoc.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Vista breytingar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* ============================================================
          MEMBER MANAGEMENT
      ============================================================ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Meðlimir</CardTitle>
              <CardDescription>
                Stjórnendur og meðlimir húsfélagsins
              </CardDescription>
            </div>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Bjóða meðlim
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bjóða nýjan meðlim</DialogTitle>
                  <DialogDescription>
                    Sláðu inn netfang þess aðila sem þú vilt bjóða í húsfélagið.
                    Þeir verða að vera skráðir notendur.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={inviteForm.handleSubmit(onInvite)} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Netfang</Label>
                    <Input
                      type="email"
                      placeholder="jon@husfelag.is"
                      {...inviteForm.register('email')}
                    />
                    {inviteForm.formState.errors.email && (
                      <p className="text-xs text-destructive">
                        {inviteForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Hlutverk</Label>
                    <Select
                      value={inviteForm.watch('role')}
                      onValueChange={(v) =>
                        inviteForm.setValue('role', v as MemberRole)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Formaður</SelectItem>
                        <SelectItem value="board">Stjórnarsmeðlimur</SelectItem>
                        <SelectItem value="member">Meðlimur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setInviteOpen(false)}
                    >
                      Hætta við
                    </Button>
                    <Button type="submit" disabled={inviteMember.isPending}>
                      {inviteMember.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Senda boð
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Notandi</TableHead>
                <TableHead>Netfang</TableHead>
                <TableHead>Hlutverk</TableHead>
                <TableHead className="text-right">Aðgerðir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Engir meðlimir skráðir
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => {
                  const isCurrentUser = member.user_id === user?.id;
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.profile?.full_name ?? 'Óþekktur notandi'}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-muted-foreground">(þú)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {isCurrentUser ? user?.email : (member.user_id.slice(0, 8) + '...')}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={member.role}
                          disabled={isCurrentUser}
                          onValueChange={(val) =>
                            updateRole.mutateAsync({
                              memberId: member.id,
                              newRole: val as MemberRole,
                              associationId: association.id,
                            })
                          }
                        >
                          <SelectTrigger className="h-7 w-40 text-xs">
                             <SelectValue>
                               <span>
                                 <Badge
                                   variant="secondary"
                                   className={`text-xs ${ROLE_COLORS[member.role]}`}
                                 >
                                   {ROLE_LABELS[member.role]}
                                 </Badge>
                               </span>
                             </SelectValue>
                           </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(ROLE_LABELS) as MemberRole[]).map((role) => (
                              <SelectItem key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        {!isCurrentUser && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-destructive hover:text-destructive"
                            onClick={() =>
                              removeMember.mutateAsync({
                                memberId: member.id,
                                associationId: association.id,
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
