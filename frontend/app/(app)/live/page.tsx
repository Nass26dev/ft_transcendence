"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LiveScreen } from "@/components/kop/screens/LiveScreen";
import type { Match } from "@/utils/types";

export default function LivePage() {
  const router = useRouter();

  // Stub : pas de state slip ici tant qu'il n'y a pas de provider partagé
  const handlePick = (_match: Match, _k: string) => {
    console.log("pick", _match.id, _k);
  };

  const isPicked = (_mId: string, _k: string) => false;

  return (
    <LiveScreen
      onPick={handlePick}
      isPicked={isPicked}
      onOpen={(id) => router.push(`/matches/${id}`)}
    />
  );
}