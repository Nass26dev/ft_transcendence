import React from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

/** Bloc de section avec titre et icône optionnelle, utilisé dans tout le panneau admin. */
export function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: IconName;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-1 p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-[15px] font-bold tracking-[-0.01em]">
        {icon && <Icon name={icon} size={15} stroke={2} className="text-kop-bright" />}
        {title}
      </h2>
      {children}
    </div>
  );
}

/** Ligne d'information en lecture seule (libellé + valeur). */
export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
      <span className="text-[13px] text-text-3">{label}</span>
      <span className="text-[13.5px] font-medium text-text">{value}</span>
    </div>
  );
}

/** Badge coloré affichant le rôle d'un utilisateur (owner / admin / user). */
export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    owner: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    admin: "bg-kop/15 text-kop-bright border-kop/30",
    user: "bg-surface-3 text-text-3 border-border",
  };
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${colors[status] ?? colors.user}`}
    >
      {status}
    </span>
  );
}

/** Tuile de statistique globale (icône, libellé, valeur, indication secondaire). */
export function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: IconName;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-1 p-4">
      <div className="mb-2 flex items-center gap-2 text-text-3">
        <Icon name={icon} size={14} stroke={2} />
        <span className="text-[12px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="font-display text-[22px] font-bold tracking-[-0.01em] text-text">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[12px] text-text-3">{hint}</div>}
    </div>
  );
}
