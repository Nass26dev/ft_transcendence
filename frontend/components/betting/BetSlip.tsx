"use client";

import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { KCoin } from "@/components/ui/Kops";
import { slideOverVariants } from "@/components/ui/motion";
import type { SlipPick, PlacePayload } from "@/utils/types";

/** Props du ticket de pari flottant. */
interface BetSlipProps {
  picks: SlipPick[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onPlace: (payload: PlacePayload) => void;
  onClose: () => void;
  balance: number;
}

/** Mise proposée à l'ouverture, ramenée au solde si celui-ci est plus bas
 *  (un nouveau compte démarre à 100 Kops). */
const DEFAULT_STAKE = 200;

/** Paliers de mise rapide ; ceux au-dessus du solde sont désactivés. */
const QUICK_STAKES = [100, 500, 1000, 5000];

/** Ticket de pari flottant : liste des picks, saisie de la mise, calcul du
 *  gain potentiel et validation. Masqué dès qu'il n'y a plus aucun pick. */
export function BetSlip({
  picks,
  onRemove,
  onClear,
  onPlace,
  onClose,
  balance,
}: BetSlipProps) {
  const [stake, setStake] = React.useState<number>(() =>
    Math.min(DEFAULT_STAKE, balance),
  );

  const totalOdd = picks.reduce((acc, p) => acc * p.odd, 1);
  const isCombo = picks.length > 1;
  const payout = Math.round(stake * totalOdd);
  const profit = payout - stake;
  const valid = picks.length > 0 && stake > 0 && stake <= balance;

  if (picks.length === 0) return null;

  return (
    <motion.div
      variants={slideOverVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="fixed inset-x-3 bottom-3 z-[100] flex max-h-[calc(100vh-100px)] flex-col overflow-hidden rounded-[14px] border border-border-strong bg-surface-1 shadow-[0_20px_60px_rgba(0,0,0,0.6)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[360px]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <h3 className="font-display text-base font-bold">
          Mon ticket
          <span className="ml-2 rounded bg-kop px-1.5 py-0.5 text-[11px] font-bold text-white">
            {picks.length}
          </span>
        </h3>
        <div className="flex gap-1">
          <button
            onClick={onClear}
            title="Tout vider"
            className="rounded-lg p-2 text-text-2 transition-colors hover:bg-surface-1 hover:text-text"
          >
            <Icon name="x" size={14} />
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-2 transition-colors hover:bg-surface-1 hover:text-text"
          >
            <Icon name="chevronD" size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3.5">
        {picks.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5"
          >
            <div className="mb-1 text-xs text-text-3">{p.game}</div>
            <div className="flex items-center justify-between text-[13px] font-semibold">
              <span>{p.label}</span>
              <span className="flex items-center gap-2">
                <span className="font-mono tnum text-green">
                  {p.odd.toFixed(2)}
                </span>
                <button
                  onClick={() => onRemove(p.id)}
                  className="px-1 py-0.5 text-text-3 transition-colors hover:text-kop-bright"
                >
                  <Icon name="x" size={14} />
                </button>
              </span>
            </div>
          </div>
        ))}

        {isCombo && (
          <div className="flex items-center justify-between px-1 py-1.5 text-[12.5px]">
            <span className="text-text-3">Cote combinée</span>
            <span className="font-mono tnum font-bold text-green">
              ×{totalOdd.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-border bg-surface-2 px-4 py-3.5">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
          Mise
        </div>

        <div className="my-3 flex gap-2">
          <input
            type="number"
            value={stake}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              setStake(Math.max(0, isNaN(parsed) ? 0 : parsed));
            }}
            className="tnum flex-1 rounded-lg border border-border-strong bg-bg px-3.5 py-3 font-display text-lg font-bold outline-none focus:border-kop"
          />
          <div className="flex items-center">
            <KCoin size={20} />
          </div>
        </div>

        <div className="mb-3 flex gap-1.5">
          {QUICK_STAKES.map((v) => (
            <button
              key={v}
              onClick={() => setStake(v)}
              disabled={v > balance}
              className="rounded-md bg-surface-3 px-3 py-2 text-xs font-semibold transition-colors hover:bg-border-strong disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-surface-3"
            >
              {v.toLocaleString("fr-FR")}
            </button>
          ))}
          <button
            onClick={() => setStake(balance)}
            className="rounded-md bg-surface-3 px-3 py-2 text-xs font-semibold transition-colors hover:bg-border-strong"
          >
            Max
          </button>
        </div>

        <div className="my-1.5 flex items-center justify-between text-[13px]">
          <span className="text-text-3">Bénéfice</span>
          <span className="font-mono tnum font-bold text-text-2">
            +{profit.toLocaleString("fr-FR")} K
          </span>
        </div>

        <div className="my-1.5 flex items-center justify-between text-[13px]">
          <span className="font-semibold text-text-2">Tu remportes</span>
          <span className="font-mono tnum text-lg font-bold text-green">
            {payout.toLocaleString("fr-FR")} K
          </span>
        </div>

        <button
          disabled={!valid}
          onClick={() => onPlace({ stake, payout, totalOdd, picks })}
          className="mt-3 w-full rounded-md bg-kop px-5 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-kop-bright hover:-translate-y-px hover:shadow-[0_6px_22px_-8px_var(--kop)] disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-text-3 disabled:transform-none disabled:shadow-none"
        >
          {stake > balance || balance === 0
            ? "Solde insuffisant"
            : `Placer le pari · ${stake.toLocaleString("fr-FR")} K`}
        </button>

        <div className="mt-2 text-center text-[11px] text-text-3">
          Pas d&apos;argent réel. 100 % Kops, 100 % gloire.
        </div>
      </div>
    </motion.div>
  );
}