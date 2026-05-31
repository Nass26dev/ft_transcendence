// Helpers de présentation purs : mapping valeur -> classes/couleurs.

/** Couleur du rang (or / argent / bronze / défaut). */
export function getRankColor(rank: number): string {
  if (rank === 1) return "text-yellow";
  if (rank === 2) return "text-[#C5C9D1]";
  if (rank === 3) return "text-[#D88B5C]";
  return "text-text-2";
}

/** Couleur d'un delta hebdo (négatif = kop, sinon vert). */
export function getDeltaColor(delta: string): string {
  return delta.startsWith("-") ? "text-kop-bright" : "text-green";
}

/** Classes du podium (top 3) selon le rang. */
export function getPodiumColor(rank: number): string {
  if (rank === 1) return "from-yellow/20 border-yellow/40";
  if (rank === 2) return "from-[#C5C9D1]/20 border-[#C5C9D1]/40";
  return "from-[#D88B5C]/20 border-[#D88B5C]/40";
}

/** Couleur de texte lisible sur un fond d'avatar clair. */
export function getAvatarTextColor(bg: string): string {
  return bg === "#FFD60A" || bg === "#A3FF12" ? "#000" : "#fff";
}

/** Couleur d'un ROI (négatif = kop, sinon vert). Gère "-" et "−". */
export function getRoiColor(roi: string): string {
  const isNeg = roi.startsWith("-") || roi.startsWith("−");
  return isNeg ? "text-kop-bright" : "text-green";
}

/** Couleur de la barre de win rate (vert si ≥ 50, sinon kop). */
export function getWrBarColor(wr: number): string {
  return wr >= 50 ? "bg-green" : "bg-kop";
}
