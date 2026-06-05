// ============================================================
// Húsfélagið.is: Icelandic relative-date helpers
// Markmið: tími skilst í einni svipan, engin hugarreikningur.
// ============================================================

import { differenceInCalendarDays, format, isPast, isToday } from "date-fns";
import { is } from "date-fns/locale";

/**
 * Mannamál fyrir gjalddaga / áætlaðan dag.
 * - Yfirfallið → "3 vikum síðan"
 * - Í dag → "Í dag"
 * - Á morgun → "Á morgun"
 * - 2–6 dagar → "Eftir 3 daga"
 * - 7–14 dagar → "Eftir 1 viku" / "Eftir 2 vikur"
 * - Lengra → "15. mars" (íslensk dagsetning)
 */
export function relativeDueLabel(dueDateStr: string | null): string | null {
  if (!dueDateStr) return null;
  const due = new Date(dueDateStr + (dueDateStr.length === 10 ? "T00:00:00" : ""));
  if (isNaN(due.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isToday(due)) return "Í dag";

  if (isPast(due)) {
    const days = Math.abs(differenceInCalendarDays(due, today));
    if (days === 1) return "Í gær";
    if (days <= 6) return `Fyrir ${days} dögum`;
    if (days <= 13) return "Fyrir viku";
    const weeks = Math.round(days / 7);
    if (weeks <= 8) return `Fyrir ${weeks} vikum`;
    return format(due, "d. MMM", { locale: is });
  }

  const days = differenceInCalendarDays(due, today);
  if (days === 1) return "Á morgun";
  if (days <= 6) return `Eftir ${days} daga`;
  if (days <= 13) return "Eftir viku";
  if (days <= 28) {
    const weeks = Math.round(days / 7);
    return `Eftir ${weeks} vikur`;
  }
  return format(due, "d. MMM", { locale: is });
}

/**
 * Hvenær var síðast uppfært, í mannamáli.
 * "í dag", "í gær", "fyrir 3 dögum", "fyrir 2 vikum", annars dagsetning.
 */
export function relativeUpdatedLabel(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = differenceInCalendarDays(today, d);
  if (days <= 0) return "í dag";
  if (days === 1) return "í gær";
  if (days <= 6) return `fyrir ${days} dögum`;
  if (days <= 13) return "fyrir viku";
  if (days <= 28) {
    const weeks = Math.round(days / 7);
    return `fyrir ${weeks} vikum`;
  }
  return format(d, "d. MMM", { locale: is });
}
