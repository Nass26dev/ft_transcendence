/** Normalise un nom pour la recherche (minuscules, sans accents, espaces compactés). */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Nom de pays (FR) → drapeau emoji. Les drapeaux sont des emoji (intégrés à
 * l'OS) : aucune dépendance ni réseau. Couvre les sélections de Coupe du monde
 * + nations courantes (les nations britanniques utilisent leurs drapeaux
 * régionaux dédiés).
 */
const COUNTRY_FLAGS: Record<string, string> = {
  france: "🇫🇷",
  angleterre: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  ecosse: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "pays de galles": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  irlande: "🇮🇪",
  "irlande du nord": "🇬🇧",
  espagne: "🇪🇸",
  italie: "🇮🇹",
  allemagne: "🇩🇪",
  portugal: "🇵🇹",
  "pays-bas": "🇳🇱",
  belgique: "🇧🇪",
  suisse: "🇨🇭",
  autriche: "🇦🇹",
  croatie: "🇭🇷",
  suede: "🇸🇪",
  norvege: "🇳🇴",
  danemark: "🇩🇰",
  pologne: "🇵🇱",
  "republique tcheque": "🇨🇿",
  "bosnie-herzegovine": "🇧🇦",
  turquie: "🇹🇷",
  ukraine: "🇺🇦",
  bresil: "🇧🇷",
  argentine: "🇦🇷",
  uruguay: "🇺🇾",
  colombie: "🇨🇴",
  paraguay: "🇵🇾",
  "etats-unis": "🇺🇸",
  canada: "🇨🇦",
  mexique: "🇲🇽",
  panama: "🇵🇦",
  "costa rica": "🇨🇷",
  haiti: "🇭🇹",
  curacao: "🇨🇼",
  equateur: "🇪🇨",
  chili: "🇨🇱",
  maroc: "🇲🇦",
  tunisie: "🇹🇳",
  algerie: "🇩🇿",
  senegal: "🇸🇳",
  ghana: "🇬🇭",
  "cote d'ivoire": "🇨🇮",
  cameroun: "🇨🇲",
  "afrique du sud": "🇿🇦",
  egypte: "🇪🇬",
  "cap-vert": "🇨🇻",
  "rd congo": "🇨🇩",
  nigeria: "🇳🇬",
  japon: "🇯🇵",
  "coree du sud": "🇰🇷",
  "coree du nord": "🇰🇵",
  australie: "🇦🇺",
  "nouvelle-zelande": "🇳🇿",
  qatar: "🇶🇦",
  iran: "🇮🇷",
  irak: "🇮🇶",
  "arabie saoudite": "🇸🇦",
  ouzbekistan: "🇺🇿",
  jordanie: "🇯🇴",
  "emirats arabes unis": "🇦🇪",
};

/** Index normalisé (résout accents / casse / variantes d'espaces). */
const FLAGS_NORMALIZED: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_FLAGS).map(([name, flag]) => [normalize(name), flag])
);

/** Renvoie le drapeau d'une sélection nationale, ou null si l'équipe n'en est pas une. */
export function teamFlag(team: string | undefined | null): string | null {
  if (!team) return null;
  return FLAGS_NORMALIZED[normalize(team)] ?? null;
}
