/** Préférences d'interface persistées en localStorage (clé `kop.pref.*`). */

const PREFIX = "kop.pref.";

export function getPref(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(`${PREFIX}${key}`);
  return stored === null ? fallback : stored === "1";
}

export function setPref(key: string, value: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${PREFIX}${key}`, value ? "1" : "0");
}

/** Événement émis quand la préférence « animations réduites » change. */
export const REDUCE_MOTION_EVENT = "kop:reducemotion";

/** Pose/retire la classe globale qui coupe les animations CSS (cf. globals.css)
 *  et notifie les composants framer-motion (cf. MotionProvider). */
export function applyReduceMotion(enabled: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("reduce-motion", enabled);
  window.dispatchEvent(new CustomEvent(REDUCE_MOTION_EVENT, { detail: enabled }));
}
