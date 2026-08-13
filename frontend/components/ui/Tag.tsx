"use client";

import React from "react";
import type { TagKind } from "@/utils/types";

interface TagProps {
  children: React.ReactNode;
  kind?: TagKind;
}

/** Badge/étiquette compact (statut, catégorie…). `kind="live"` ajoute un point. */
export function Tag({ children, kind = "default" }: TagProps) {
  const className =
    kind === "live"
      ? "tag tag-live"
      : kind === "soon"
        ? "tag tag-soon"
        : kind === "green"
          ? "tag tag-green"
          : "tag";

  return (
    <span className={className}>
      {kind === "live" && <span className="dot" />}
      {children}
    </span>
  );
}