"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MatchesScreen } from "@/components/kop/screens/MatchesScreen";
import type { Match } from "@/utils/types";

export default function MatchesPage() {
  const router = useRouter();

  const handlePick = (_match: Match, _k: string) => {
    console.log("pick", _match.id, _k);
  };

  const isPicked = (_mId: string, _k: string) => false;

  return (
    <MatchesScreen
      onPick={handlePick}
      isPicked={isPicked}
      onOpen={(id) => router.push(`/matches/${id}`)}
    />
  );
}