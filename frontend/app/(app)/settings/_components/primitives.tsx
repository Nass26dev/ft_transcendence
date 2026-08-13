import React from "react";

/** Bloc de section avec titre, utilisé pour regrouper les réglages par thème. */
export function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-1 p-6">
      <h2 className="mb-4 font-display text-[17px] font-bold tracking-[-0.01em]">
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

/** Champ de texte étiqueté pour l'édition d'une donnée de profil. */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-[10px] border border-border bg-surface-2 px-3.5 py-2.5 text-[13.5px] text-text outline-none transition-colors placeholder:text-text-3 focus:border-kop"
      />
    </label>
  );
}

/** Ligne de réglage avec interrupteur on/off (label, description et switch). */
export function ToggleRow({
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3.5 last:border-b-0">
      <div className="min-w-0 pr-4">
        <div className="text-[13.5px] font-medium text-text">{label}</div>
        <div className="text-[12px] text-text-3">{desc}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors disabled:opacity-50",
          checked ? "bg-kop" : "bg-surface-3",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
