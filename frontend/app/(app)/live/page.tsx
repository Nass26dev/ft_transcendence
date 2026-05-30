"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LIVE, MATCHES } from "@/data/kop-data";
import type { Match } from "@/utils/types";
import { LiveGrid } from "./_components/LiveGrid";
import { UpcomingList } from "./_components/UpcomingList";

export default function LivePage() {
  const router = useRouter();

  // Stub : pas de state slip ici tant qu'il n'y a pas de provider partagé
  const handlePick = (_match: Match, _k: string) => {
    console.log("pick", _match.id, _k);
  };

  const isPicked = (_mId: string, _k: string) => false;

  const handlers = {
    onPick: handlePick,
    isPicked,
    onOpen: (id: string) => router.push(`/matches/${id}`),
  };

  return (
    <div className="max-w-[1480px] px-8 pb-15 pt-7">
      <LiveGrid matches={LIVE} {...handlers} />
      <UpcomingList matches={MATCHES.slice(0, 5)} {...handlers} />
    </div>
  );
}
