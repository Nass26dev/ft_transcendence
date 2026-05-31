type Identity = {
  first_name?: string;
  last_name?: string;
  username: string;
  email: string;
};

/** Initiales d'affichage : prénom/nom, sinon username/email. */
export function userInitials(p: Identity): string {
  const fn = p.first_name?.[0] ?? "";
  const ln = p.last_name?.[0] ?? "";
  if (fn || ln) return (fn + ln).toUpperCase();
  return (p.username || p.email).slice(0, 2).toUpperCase();
}

/** Nom d'affichage : "Prénom Nom", sinon username, sinon préfixe email. */
export function displayName(p: Identity): string {
  const full = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
  return full || p.username || p.email.split("@")[0];
}
