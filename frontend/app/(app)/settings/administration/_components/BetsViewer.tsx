import { num, fmt } from "./helpers";
import type { Bet } from "./types";

/** Historique en lecture seule des paris d'un utilisateur, avec statut coloré. */
export function BetsViewer({ bets }: { bets: Bet[] }) {
  const statusColors: Record<string, string> = {
    won: "text-green-400",
    lost: "text-red-400",
    pending: "text-amber-400",
    cancelled: "text-text-3",
  };

  if (bets.length === 0) {
    return <p className="text-[13px] text-text-3">Aucun pari.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {bets.map((b) => {
        const label =
          b.selections.length > 0
            ? b.selections.map((s) => s.match).join(" · ")
            : "Pari";
        return (
          <div key={b.id} className="flex items-start justify-between gap-4 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-medium text-text">{label}</div>
              <div className="text-[12px] text-text-3">
                {new Date(b.created_at).toLocaleDateString("fr-FR")} ·{" "}
                {b.selections.length} sélection{b.selections.length > 1 ? "s" : ""} · cote{" "}
                {num(b.odd_value).toFixed(2)}
              </div>
            </div>
            <div className="flex flex-none flex-col items-end">
              <span className="text-[13px] font-semibold text-text">{fmt(b.stake)} Kops</span>
              <span
                className={`text-[12px] font-medium capitalize ${statusColors[b.status] ?? "text-text-3"}`}
              >
                {b.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
