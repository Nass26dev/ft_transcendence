/** Coerce en nombre : DRF sérialise les DecimalField en chaînes (ex. "100.00"). */
export const num = (v: unknown) => Number(v ?? 0);

/** Formate un montant (Decimal ou number) en nombre localisé fr-FR. */
export const fmt = (v: unknown) => num(v).toLocaleString("fr-FR");

/** Initiales (2 lettres majuscules) affichées dans les avatars de la liste admin. */
export const initialsOf = (name: string) => name.slice(0, 2).toUpperCase();

/** Message d'erreur lisible à partir d'une erreur axios. */
export function errMessage(e: unknown, fallback: string): string {
  const data = (e as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const first = Object.values(data as Record<string, unknown>)[0];
    if (typeof first === "string") return first;
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  }
  return fallback;
}
