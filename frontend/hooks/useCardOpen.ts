"use client";

import React from "react";

/**
 * Handler de clic pour une carte de match : ouvre le détail, sauf si le clic
 * vise une pastille de cote (`[data-odd-pill]`, qui gère son propre onClick).
 */
export function useCardOpen(id: string, onOpen: (id: string) => void) {
  return React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!(e.target as HTMLElement).closest("[data-odd-pill]")) {
        onOpen(id);
      }
    },
    [id, onOpen],
  );
}
