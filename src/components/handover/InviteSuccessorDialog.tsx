// ============================================================
// InviteSuccessorDialog.tsx
// Warm handover: invite a new chairman/board member
// ============================================================

import { useState } from "react";
import { UserPlus, Copy, Check, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { is } from "date-fns/locale";

import { db } from "@/integrations/supabase/db";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentAssociation } from "@/hooks/useAssociation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  trigger?: React.ReactNode;
}

export default function InviteSuccessorDialog({ trigger }: Props) {
  const { user } = useAuth();
  const { data: association } = useCurrentAssociation();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [handoverDate, setHandoverDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setName("");
    setEmail("");
    setMessage("");
    setHandoverDate("");
    setInviteLink(null);
    setCopied(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !association) return;
    if (!name.trim() || !email.trim()) {
      toast.error("Nafn og netfang þurfa að vera fyllt út");
      return;
    }

    setSubmitting(true);
    try {
      // Look up inviter's name
      const { data: profile } = await db
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data, error } = await db
        .from("handover_invitations")
        .insert({
          association_id: association.id,
          invited_by: user.id,
          invited_by_name: profile?.full_name ?? null,
          invitee_email: email.trim().toLowerCase(),
          invitee_name: name.trim(),
          personal_message: message.trim() || null,
          handover_date: handoverDate || null,
          role: "board",
        })
        .select("token")
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/velkomin/${data.token}`;
      setInviteLink(link);
      toast.success(`Boð útbúið fyrir ${name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Villa kom upp";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Slóð afrituð");
    setTimeout(() => setCopied(false), 2000);
  };

  const openEmail = () => {
    if (!inviteLink || !association) return;
    const subject = encodeURIComponent(
      `Þú ert boðin/n inn í stjórn ${association.name}`
    );
    const dateStr = handoverDate
      ? format(new Date(handoverDate), "d. MMMM yyyy", { locale: is })
      : "";
    const body = encodeURIComponent(
      `Hæ ${name},\n\n` +
        (message ? `${message}\n\n` : "") +
        `Ég er að færa þér umsjón með húsfélaginu ${association.name}` +
        (dateStr ? ` þann ${dateStr}` : "") +
        `.\n\nSmelltu á þessa slóð til að taka við:\n${inviteLink}\n\n` +
        `Þú færð yfirsýn yfir fjármálin, opin verkefni og allt sem þú þarft til að byrja.\n\nKveðja`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Bjóða nýjan formann
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bjóða nýjan formann</DialogTitle>
          <DialogDescription>
            Sá sem tekur við fær persónulega móttöku, afhendingarpakkann og
            aðgang að kerfinu.
          </DialogDescription>
        </DialogHeader>

        {!inviteLink ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nafn</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sigríður Jónsdóttir"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Netfang</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sigridur@example.is"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Yfirtökudagur (valfrjálst)</Label>
              <Input
                id="date"
                type="date"
                value={handoverDate}
                onChange={(e) => setHandoverDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg">Persónuleg kveðja (valfrjálst)</Label>
              <Textarea
                id="msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Takk fyrir að taka við. Hér er allt sem ég veit..."
                rows={4}
              />
              <p className="text-xs text-zinc-500">
                Þessi kveðja birtist nýja formanninum þegar hann opnar boðið.
              </p>
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Útbý boð...
                </>
              ) : (
                "Útbúa boð"
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-teal-50 border border-teal-200 p-4">
              <p className="text-sm text-teal-900 font-medium">
                Boð tilbúið fyrir {name}
              </p>
              <p className="text-xs text-teal-700 mt-1">
                Sendu slóðina hér að neðan. Hún gildir í 30 daga.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Boðsslóð</Label>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-teal-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button onClick={openEmail} className="w-full gap-2">
              <Mail className="h-4 w-4" />
              Opna í tölvupósti
            </Button>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="w-full"
            >
              Loka
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
