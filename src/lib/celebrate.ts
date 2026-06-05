// ============================================================
// celebrate.ts — Dopamine-feedback fyrir kláraðar aðgerðir.
// "Peak-end rule" + Duolingo-style satisfaction loop.
// ============================================================

import confetti from "canvas-confetti";
import { toast } from "sonner";

const TEAL = "#0d9488";
const TEAL_LIGHT = "#5eead4";
const AMBER = "#f59e0b";

interface CelebrateOptions {
  /** Aðaltexti — t.d. "Vel gert, Sigríður" */
  title: string;
  /** Stutt undirtexti — t.d. "2 verkefni eftir í dag" */
  subtitle?: string;
  /** "burst" (lítill, default) | "shower" (stærri, fyrir aðalmiljustones) */
  intensity?: "burst" | "shower";
}

/**
 * Lítill, ánægjulegur „peak-end" skammtur.
 * Lítil hreyfimynd (confetti) + sonner toast með bakgrunn.
 */
export function celebrate({ title, subtitle, intensity = "burst" }: CelebrateOptions) {
  // Skip animation ef notandi kýs „reduced motion"
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReduced) {
    const baseOpts = {
      colors: [TEAL, TEAL_LIGHT, AMBER],
      scalar: 0.85,
      ticks: 120,
      gravity: 0.9,
      disableForReducedMotion: true,
    };

    if (intensity === "shower") {
      // Frá báðum hliðum, lengra
      confetti({ ...baseOpts, particleCount: 60, angle: 60, spread: 70, origin: { x: 0, y: 0.7 } });
      confetti({ ...baseOpts, particleCount: 60, angle: 120, spread: 70, origin: { x: 1, y: 0.7 } });
    } else {
      // Lítill burst frá botni miðju (þumalsvæði)
      confetti({
        ...baseOpts,
        particleCount: 35,
        spread: 55,
        startVelocity: 28,
        origin: { x: 0.5, y: 0.85 },
      });
    }
  }

  toast.success(title, {
    description: subtitle,
    duration: 3500,
  });
}
