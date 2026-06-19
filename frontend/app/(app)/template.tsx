"use client";

import React from "react";
import { motion } from "framer-motion";
import { EASE } from "@/components/ui/motion";

/**
 * Transition de page (App Router) : un `template` se remonte à chaque
 * navigation, donc l'animation d'entrée rejoue à chaque changement de route.
 * Enveloppe le contenu de page (pas la sidebar/topbar, situées dans le layout).
 * Respecte « animations réduites » via MotionProvider (reducedMotion → fondu seul).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
