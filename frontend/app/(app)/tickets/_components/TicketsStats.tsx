import React from "react";
import { StatCard } from "@/components/ui/StatCard";

export function TicketsStats() {
  return (
    <div className="mb-6 grid grid-cols-4 gap-3.5">
      <StatCard
        label="Tickets en cours"
        value="1"
        delta="200 K en jeu"
        deltaKind="muted"
      />
      <StatCard
        label="Gain potentiel"
        value="1 620"
        valueKind="green"
        delta="×8.10 cote"
        deltaKind="up"
      />
      <StatCard
        label="Win rate"
        value="54 %"
        delta="+3 % cette sem."
        deltaKind="up"
      />
      <StatCard
        label="ROI"
        value="+12.4 %"
        valueKind="green"
        delta="+850 K ce mois"
        deltaKind="up"
      />
    </div>
  );
}
