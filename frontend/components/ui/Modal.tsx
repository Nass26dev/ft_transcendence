"use client";

import React from "react";
import { motion } from "framer-motion";
import { overlayVariants, modalPanelVariants } from "./motion";

/** Modale animée (voile + panneau). À placer dans un <AnimatePresence> côté
 *  parent pour bénéficier de l'animation de sortie. */
export function Modal({
  onClose,
  children,
  className = "",
}: {
  onClose: () => void;
  children: React.ReactNode;
  /** Classes du panneau (largeur, etc.). */
  className?: string;
}) {
  const handleOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <motion.div
      variants={overlayVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      onClick={handleOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <motion.div
        variants={modalPanelVariants}
        onClick={(e) => e.stopPropagation()}
        className={className}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
