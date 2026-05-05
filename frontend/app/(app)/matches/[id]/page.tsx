"use client";

import React from "react";
import { useParams } from "next/navigation";
import { MatchDetailScreen } from "@/components/kop/screens/MatchDetailScreen";
import type { Match } from "@/utils/types";

export default function MatchDetailPage() {
  const params = useParams<{ id: string }>();

  const handlePick = (_match: Match, _k: string, _label?: string) => {
    console.log("pick", _match.id, _k, _label);
  };

  const isPicked = (_mId: string, _k: string) => false;

  return (
    <MatchDetailScreen
      matchId={params.id}
      onPick={handlePick}
      isPicked={isPicked}
      onOpen={() => {}}
    />
  );
}