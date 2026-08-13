import React from "react";

/** En-tête de section réutilisable : titre, sous-titre optionnel et action alignée à droite. */
export function SectionHead({
  title,
  sub,
  action,
}: {
  title: React.ReactNode;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3.5 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="flex items-center gap-2 font-display text-[22px] font-bold tracking-[-0.02em]">
          {title}
        </h2>
        {sub && <div className="mt-0.5 text-[13px] text-text-3">{sub}</div>}
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  );
}
