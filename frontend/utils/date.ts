/** Formatage des dates de coup d'envoi (fr-FR), partagé par les vues matchs. */

/**
 * Coup d'envoi formaté.
 * - "short" (cartes) : « lun. 23/06 21:00 »
 * - "long"  (page détail) : « lundi 23 juin 21:00 »
 */
export function formatKickoff(iso: string, variant: "short" | "long" = "short"): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: variant === "long" ? "long" : "short",
    day: "2-digit",
    month: variant === "long" ? "long" : "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Coup d'envoi scindé en [date, heure] (ex. ["23/06", "21:00"]) pour les lignes compactes. */
export function splitKickoff(iso: string): [string, string] {
  if (!iso) return ["", ""];
  const d = new Date(iso);
  return [
    d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  ];
}
