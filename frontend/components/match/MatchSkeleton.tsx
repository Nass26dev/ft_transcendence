"use client";

import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

/** Placeholder d'une carte de match (grilles : home, "tous les matches", live). */
export function MatchCardSkeleton() {
  return (
    <div className="rounded-[10px] border border-border bg-surface-1 px-4.5 py-4">
      <div className="mb-3.5 flex items-center gap-2.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-3.5">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-[22px] w-[22px] rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-[22px] w-[22px] rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-9 w-12 rounded-[8px]" />
          <Skeleton className="h-9 w-12 rounded-[8px]" />
          <Skeleton className="h-9 w-12 rounded-[8px]" />
        </div>
      </div>
      <Skeleton className="mt-3.5 h-1.5 w-full rounded-[3px]" />
    </div>
  );
}

/** Placeholder d'une ligne compacte (liste "à venir" sur /live). */
export function CompactRowSkeleton() {
  return (
    <div className="grid grid-cols-[88px_1fr_auto] items-center gap-4 border-b border-border px-4 py-3.5 last:border-b-0">
      <Skeleton className="h-4 w-12" />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-[18px] w-[18px] rounded-full" />
          <Skeleton className="h-3.5 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-[18px] w-[18px] rounded-full" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-8 w-11 rounded-[8px]" />
        <Skeleton className="h-8 w-11 rounded-[8px]" />
        <Skeleton className="h-8 w-11 rounded-[8px]" />
      </div>
    </div>
  );
}

/** Grille de cartes placeholder (n cartes). */
export function MatchCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  );
}
