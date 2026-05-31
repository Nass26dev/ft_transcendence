import React from "react";
import { StatCard } from "@/components/ui/StatCard";

export function ProfileStats() {
  return (
    <div className="mb-6 grid grid-cols-4 gap-3.5">
      <StatCard
        label="Win rate"
        value="54 %"
        delta="+3 % cette sem."
        deltaKind="up"
      />
      <StatCard
        label="Paris totaux"
        value="147"
        delta="22 cette sem."
        deltaKind="muted"
      />
      <StatCard
        label="Streak actuelle"
        value="3 V"
        delta="↑ Continue"
        deltaKind="up"
      />
      <StatCard
        label="Plus gros gain"
        value="8 420"
        valueKind="green"
        delta="×16.84 il y a 2 sem."
        deltaKind="muted"
      />
    </div>
  );
}
