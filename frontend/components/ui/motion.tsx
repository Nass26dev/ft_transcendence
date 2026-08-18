"use client";

import React from "react";
import { MotionConfig, type Variants, type Transition } from "framer-motion";
import { getPref, REDUCE_MOTION_EVENT } from "@/utils/prefs";

/** Courbe d'accélération maison (easeOut soutenu), cohérente dans toute l'app. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Transition ressort par défaut pour les apparitions avec rebond. */
export const SPRING: Transition = { type: "spring", stiffness: 420, damping: 32 };

/** Apparition douce depuis le bas. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.15, ease: EASE } },
};

/** Conteneur qui décale l'apparition de ses enfants (listes). */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } },
};

/** Élément d'une liste staggerée. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
};

/** Voile d'arrière-plan d'une modale. */
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Panneau d'une modale (fondu + léger zoom/translation). */
export const modalPanelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: SPRING },
  exit: { opacity: 0, scale: 0.97, y: 6, transition: { duration: 0.15, ease: EASE } },
};

/** Menu déroulant (notifications, recherche) ancré en haut. */
export const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: EASE } },
  exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12, ease: EASE } },
};

/** Toast (entrée par la droite). */
export const toastVariants: Variants = {
  hidden: { opacity: 0, x: 24, scale: 0.96 },
  show: { opacity: 1, x: 0, scale: 1, transition: SPRING },
  exit: { opacity: 0, x: 24, scale: 0.96, transition: { duration: 0.18, ease: EASE } },
};

/** Bouton flottant (pop). */
export const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: SPRING },
  exit: { opacity: 0, scale: 0.8, y: 12, transition: { duration: 0.15, ease: EASE } },
};

/** Panneau qui glisse depuis la droite (bet slip). */
export const slideOverVariants: Variants = {
  hidden: { opacity: 0, x: 32 },
  show: { opacity: 1, x: 0, transition: SPRING },
  exit: { opacity: 0, x: 32, transition: { duration: 0.18, ease: EASE } },
};

/** Branche framer-motion sur la préférence « animations réduites » de l'app :
 *  quand elle est active, framer ne joue plus que des fondus (pas de transform). */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    setReduced(getPref("reduceMotion", false));
    const onChange = (e: Event) => setReduced(Boolean((e as CustomEvent).detail));
    window.addEventListener(REDUCE_MOTION_EVENT, onChange);
    return () => window.removeEventListener(REDUCE_MOTION_EVENT, onChange);
  }, []);

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"}>
      {children}
    </MotionConfig>
  );
}
