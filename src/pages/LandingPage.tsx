// ============================================================
// Húsfélagið.is — Public Landing Page (Arctic Editorial)
// ============================================================

import { Link } from "react-router-dom";
import {
  ShieldCheck,
  BarChart3,
  ClipboardList,
  Building2,
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  Globe,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Heim", href: "#" },
  { label: "Lausnir", href: "#features" },
  { label: "Verðskrá", href: "#pricing" },
  { label: "Um okkur", href: "#footer" },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Sjálfvirk færsluflokkun",
    description:
      "Gervigreind okkar flokkar sjálfkrafa bankafærslur svo þú hafir alltaf rétta yfirsýn án handavinnu.",
    cta: "Læra meira",
  },
  {
    icon: BarChart3,
    title: "Skýr fjárhagsyfirlit",
    description:
      "Rauntíma yfirlit yfir rekstur, framkvæmdasjóð og hússjóð í auðskiljanlegum gröfum og töflum.",
    cta: "Skoða sýnishorn",
  },
  {
    icon: ClipboardList,
    title: "Einföld verkefnastýring",
    description:
      "Haltu utan um viðhald, tilboð og samskipti við verktaka á einum miðlægum stað fyrir stjórnina.",
    cta: "Sjá nánar",
  },
];

const TRUST_ITEMS = [
  { icon: Building2, name: "Laugavegur 12" },
  { icon: Building2, name: "Hlíðarfótur 4" },
  { icon: Building2, name: "Sólvallagata 8" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-heading text-xl font-bold text-primary tracking-tight">
            Húsfélagið.is
          </span>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Innskráning</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth">Prófa frítt</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-muted">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:py-28 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Text */}
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Ný kynslóð hússtjórnar
            </div>

            <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Einfaldari rekstur{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                húsfélagsins
              </span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Stjórnaðu fjármálum, verkefnum og færslum á einum stað. Öruggt,
              skýrt og þægilegt fyrir alla íbúa.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Prófa frítt í 30 daga
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#features">Sjá hvernig það virkar</a>
              </Button>
            </div>

            <p className="mt-8 text-sm text-muted-foreground">
              Yfir <span className="font-semibold text-foreground">200 húsfélög</span> nota
              Húsfélagið.is á hverjum degi.
            </p>
          </div>

          {/* Mock dashboard card */}
          <div className="relative hidden lg:block">
            <div className="rounded-2xl bg-card p-8 shadow-[0_12px_32px_-4px_rgba(25,28,29,0.08)]">
              <p className="text-sm font-medium text-muted-foreground">
                Staða húsfélags
              </p>
              <p className="mt-2 font-heading text-4xl font-bold tabular-nums text-foreground">
                12.450.000 kr.
              </p>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-[hsl(160,60%,94%)] px-3 py-1 text-sm font-semibold text-[hsl(160,60%,30%)]">
                <TrendingUp className="h-4 w-4" />
                +2,4%
              </div>

              {/* Mini chart placeholder bars */}
              <div className="mt-8 flex items-end gap-2">
                {[40, 55, 35, 65, 50, 72, 60, 80, 68, 90, 75, 95].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-primary/15"
                      style={{ height: `${h}px` }}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-background py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 max-w-2xl">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Allt sem þú þarft á einum stað
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Hannað með íslenskar aðstæður og lög um húsfélög í huga.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl bg-card p-8 shadow-[0_12px_32px_-4px_rgba(25,28,29,0.04)] transition-shadow hover:shadow-[0_12px_32px_-4px_rgba(25,28,29,0.10)]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  {f.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
                <a
                  href="#"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-accent"
                >
                  {f.cta}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust / Social Proof ── */}
      <section className="bg-muted py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Traustið er undirstaðan
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Yfir 200 húsfélög um allt land treysta okkur fyrir sínum rekstri
          </p>

          <div className="mx-auto mt-12 grid max-w-md gap-4 sm:max-w-2xl sm:grid-cols-3">
            {TRUST_ITEMS.map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-3 rounded-2xl bg-card p-5 shadow-[0_12px_32px_-4px_rgba(25,28,29,0.04)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <t.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="pricing" className="bg-background py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tilbúin að einfalda lífið?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Skráðu húsfélagið í dag og fáðu fullan aðgang að öllum kerfum okkar
            frítt í einn mánuð. Engar skuldbindingar.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/auth">
                Byrja ókeypis prufu
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="mailto:hallo@husfelagid.is">Bóka kynningu</a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        id="footer"
        className="bg-primary text-primary-foreground"
      >
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <span className="font-heading text-xl font-bold tracking-tight">
              Húsfélagið.is
            </span>
            <p className="mt-4 text-sm leading-relaxed opacity-70">
              Við sérhæfum okkur í að gera rekstur húsfélaga skýrari, öruggari
              og skemmtilegri með nútíma tækni.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                aria-label="Vefsíða"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a
                href="mailto:hallo@husfelagid.is"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                aria-label="Tölvupóstur"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Vara */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider opacity-60">
              Vara
            </h4>
            <ul className="space-y-2.5 text-sm opacity-80">
              <li><a href="#features" className="hover:opacity-100">Eiginleikar</a></li>
              <li><a href="#pricing" className="hover:opacity-100">Verðskrá</a></li>
              <li><a href="#" className="hover:opacity-100">Öryggi</a></li>
              <li><a href="#" className="hover:opacity-100">Samþættingar</a></li>
            </ul>
          </div>

          {/* Fyrirtækið */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider opacity-60">
              Fyrirtækið
            </h4>
            <ul className="space-y-2.5 text-sm opacity-80">
              <li><a href="#" className="hover:opacity-100">Um okkur</a></li>
              <li><a href="#" className="hover:opacity-100">Blogg</a></li>
              <li><a href="#" className="hover:opacity-100">Hafðu samband</a></li>
              <li><a href="#" className="hover:opacity-100">Starfsemi</a></li>
            </ul>
          </div>

          {/* Hafðu samband */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider opacity-60">
              Hafðu samband
            </h4>
            <ul className="space-y-3 text-sm opacity-80">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Laugavegur 100, 101 Reykjavík</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+354 511 0000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span>halló@husfelagid.is</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs opacity-60 sm:flex-row">
            <span>© 2026 Húsfélagið ehf. Allur réttur áskilinn.</span>
            <div className="flex gap-6">
              <a href="#" className="hover:opacity-100">Persónuvernd</a>
              <a href="#" className="hover:opacity-100">Skilmálar</a>
              <a href="#" className="hover:opacity-100">Vafrakökur</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
