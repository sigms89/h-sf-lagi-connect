// ============================================================
// WelcomeNewChairman.tsx
// /velkomin/:token - warm welcome page for the new chairman
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { is } from "date-fns/locale";
import { Loader2, Heart, CheckCircle2, ArrowRight, Building2, Wallet, ListChecks, FileText, Sparkles } from "lucide-react";

import { db, supabase } from "@/integrations/supabase/db";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Invitation {
  id: string;
  invited_by_name: string | null;
  invitee_name: string;
  invitee_email: string;
  personal_message: string | null;
  handover_date: string | null;
  status: string;
  expires_at: string;
  association_id: string;
  association_name?: string;
}

export default function WelcomeNewChairman() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [justAccepted, setJustAccepted] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      const { data, error } = await db
        .from("handover_invitations")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (error || !data) {
        setError("Boð fannst ekki");
        setLoading(false);
        return;
      }

      // Load association name
      const { data: assoc } = await db
        .from("associations")
        .select("name")
        .eq("id", data.association_id)
        .maybeSingle();

      setInvitation({ ...data, association_name: assoc?.name });
      setLoading(false);
    };
    load();
  }, [token]);

  const handleAccept = async () => {
    if (!token || !invitation) return;

    if (!user) {
      // Redirect to auth, then come back
      navigate(
        `/auth?redirect=${encodeURIComponent(`/velkomin/${token}`)}&email=${encodeURIComponent(invitation.invitee_email)}`
      );
      return;
    }

    setAccepting(true);
    try {
      const { error } = await supabase.rpc("accept_handover_invitation", {
        _token: token,
      });
      if (error) throw error;
      setJustAccepted(true);
      setAccepting(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Villa kom upp";
      setError(msg);
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6 flex items-center justify-center">
        <Skeleton className="h-96 w-full max-w-lg" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <p className="text-zinc-900 font-medium">
              {error ?? "Boð fannst ekki"}
            </p>
            <p className="text-sm text-zinc-500">
              Slóðin er kannski útrunnin eða röng. Hafðu samband við þann sem
              sendi þér boðið.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Á forsíðu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(invitation.expires_at) < new Date();
  const isAccepted = invitation.status === "accepted";
  const dateStr = invitation.handover_date
    ? format(new Date(invitation.handover_date), "d. MMMM yyyy", { locale: is })
    : null;

  // ============================================================
  // "First 5 minutes" - shown right after accepting
  // ============================================================
  if (justAccepted) {
    const firstName = invitation.invitee_name.split(" ")[0];
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-zinc-50 p-6">
        <div className="max-w-xl mx-auto pt-12 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-teal-100">
              <Sparkles className="h-7 w-7 text-teal-600" />
            </div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Þú ert komin/n í stjórn, {firstName}
            </h1>
            <p className="text-zinc-600">
              {invitation.association_name} bíður eftir þér. Hér eru fyrstu skrefin.
            </p>
          </div>

          {invitation.personal_message && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wide text-zinc-500 font-medium mb-2">
                  Frá {invitation.invited_by_name ?? "fyrri formanni"}
                </p>
                <p className="text-zinc-800 whitespace-pre-wrap leading-relaxed italic">
                  "{invitation.personal_message}"
                </p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-zinc-500 font-medium px-1">
              Byrjaðu hér
            </p>

            <button
              onClick={() => navigate("/skyrsla")}
              className="w-full text-left bg-white rounded-xl p-4 flex items-center gap-3 hover:bg-zinc-50 transition shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]"
            >
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900">Sækja afhendingarpakka</p>
                <p className="text-sm text-zinc-500">Allt á einum stað sem PDF</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </button>

            <button
              onClick={() => navigate("/peningar")}
              className="w-full text-left bg-white rounded-xl p-4 flex items-center gap-3 hover:bg-zinc-50 transition shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]"
            >
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                <Wallet className="h-5 w-5 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900">Sjá fjármálin</p>
                <p className="text-sm text-zinc-500">Sjóðsstaða og hreyfingar</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </button>

            <button
              onClick={() => navigate("/verkefni")}
              className="w-full text-left bg-white rounded-xl p-4 flex items-center gap-3 hover:bg-zinc-50 transition shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]"
            >
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                <ListChecks className="h-5 w-5 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900">Skoða opin verkefni</p>
                <p className="text-sm text-zinc-500">Hvað bíður þín fyrst</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </button>
          </div>

          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="w-full"
          >
            Eða bara á forsíðu
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-zinc-50 p-6">
      <div className="max-w-xl mx-auto pt-12 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-teal-100">
            <Heart className="h-7 w-7 text-teal-600" />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Velkomin/n, {invitation.invitee_name.split(" ")[0]}
          </h1>
          <p className="text-zinc-600">
            {invitation.invited_by_name ?? "Núverandi formaður"} bauð þér að
            taka við húsfélaginu
          </p>
        </div>

        {/* Association card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500 font-medium">
                  Húsfélag
                </p>
                <p className="text-lg font-semibold text-zinc-900">
                  {invitation.association_name}
                </p>
                {dateStr && (
                  <p className="text-sm text-zinc-500 mt-1">
                    Yfirtaka: {dateStr}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal message */}
        {invitation.personal_message && (
          <Card className="bg-white">
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-zinc-500 font-medium mb-2">
                Kveðja frá {invitation.invited_by_name ?? "fyrri formanni"}
              </p>
              <p className="text-zinc-800 whitespace-pre-wrap leading-relaxed italic">
                "{invitation.personal_message}"
              </p>
            </CardContent>
          </Card>
        )}

        {/* What's waiting */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm font-medium text-zinc-900">
              Hvað bíður þín þegar þú skráir þig inn
            </p>
            <ul className="space-y-2 text-sm text-zinc-700">
              {[
                "Yfirlit yfir fjármál og sjóðsstöðu",
                "Opin verkefni og hver sér um hvað",
                "Listi yfir reglulega söluaðila",
                "Afhendingarpakki sem PDF",
              ].map((item) => (
                <li key={item} className="flex gap-2 items-start">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        {isAccepted ? (
          <Button onClick={() => navigate("/")} className="w-full" size="lg">
            Áfram í kerfið
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : isExpired ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-zinc-600">
                Þetta boð er útrunnið. Hafðu samband við þann sem sendi boðið
                til að fá nýtt.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full"
              size="lg"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Tek við...
                </>
              ) : user ? (
                <>
                  Taka við húsfélaginu
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Skrá mig inn og taka við
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
            {!user && (
              <p className="text-xs text-center text-zinc-500">
                Þú þarft að búa til aðgang með netfanginu {invitation.invitee_email}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
