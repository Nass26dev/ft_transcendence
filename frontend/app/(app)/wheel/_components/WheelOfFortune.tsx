"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Kops } from "@/components/ui/Kops";
import type { WheelSegment, SpinResult } from "@/app/(app)/_components/ProfileProvider";

const SIZE = 340;
const C = SIZE / 2;
const R = C - 6;
const R_LABEL = R * 0.66;

/** Point sur le cercle, angle mesuré dans le sens horaire depuis le haut. */
function point(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: C + radius * Math.sin(rad), y: C - radius * Math.cos(rad) };
}

/** Chemin SVG d'une part de tarte (sens horaire). */
function slicePath(a0: number, a1: number) {
  const p0 = point(a0, R);
  const p1 = point(a1, R);
  const largeArc = a1 - a0 > 180 ? 1 : 0;
  return `M ${C} ${C} L ${p0.x} ${p0.y} A ${R} ${R} 0 ${largeArc} 1 ${p1.x} ${p1.y} Z`;
}

const COLORS: Record<WheelSegment["kind"], { fill: string; alt: string; text: string }> = {
  jackpot: { fill: "#FFD60A", alt: "#FFC400", text: "#1A1500" },
  win: { fill: "#A3FF12", alt: "#86D60A", text: "#0C2200" },
  loss: { fill: "#E10000", alt: "#B80000", text: "#FFFFFF" },
  neutral: { fill: "#26262F", alt: "#1C1C24", text: "#B5B5BD" },
};

interface Props {
  segments: WheelSegment[];
  available: boolean;
  onSpin: () => Promise<SpinResult | null>;
}

const SPIN_MS = 5200;

/**
 * Roue de la chance animée : un tour gratuit par jour (contrôlé par `available`),
 * fait tourner la roue d'au moins 6 tours complets puis s'arrête sur le lot renvoyé
 * par le serveur (`onSpin`), en alignant le centre de la case gagnante sous le curseur.
 */
export function WheelOfFortune({ segments, available, onSpin }: Props) {
  const [rotation, setRotation] = React.useState(0);
  const [phase, setPhase] = React.useState<"idle" | "spinning" | "done">("idle");
  const [result, setResult] = React.useState<SpinResult | null>(null);

  const n = segments.length;
  const seg = n > 0 ? 360 / n : 0;

  const canSpin = available && phase !== "spinning" && n > 0;

  const handleSpin = async () => {
    if (!canSpin) return;
    setResult(null);
    setPhase("spinning");

    const res = await onSpin();
    if (!res) {
      setPhase("idle");
      return;
    }

    const center = (res.index + 0.5) * seg;
    const want = (360 - center) % 360;
    const current = ((rotation % 360) + 360) % 360;
    const extra = ((want - current + 360) % 360) + 360 * 6;
    setRotation(rotation + extra);

    window.setTimeout(() => {
      setResult(res);
      setPhase("done");
    }, SPIN_MS);
  };

  return (
    <div className="flex flex-col items-center gap-7">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <div className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2">
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "13px solid transparent",
              borderRight: "13px solid transparent",
              borderTop: "22px solid var(--kop)",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
            }}
          />
        </div>

        <motion.svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          animate={{ rotate: rotation }}
          transition={{ duration: SPIN_MS / 1000, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: "drop-shadow(0 10px 40px rgba(0,0,0,0.5))" }}
        >
          <circle cx={C} cy={C} r={R} fill="none" stroke="#3A3A45" strokeWidth={4} />

          {segments.map((s, i) => {
            const a0 = i * seg;
            const a1 = (i + 1) * seg;
            const mid = a0 + seg / 2;
            const col = COLORS[s.kind];
            const fill = i % 2 === 0 ? col.fill : col.alt;
            const lp = point(mid, R_LABEL);
            const flip = mid > 90 && mid < 270 ? 180 : 0;
            return (
              <g key={i}>
                <path d={slicePath(a0, a1)} fill={fill} stroke="#0A0A0B" strokeWidth={1.5} />
                <text
                  x={lp.x}
                  y={lp.y}
                  fill={col.text}
                  fontSize={s.kind === "jackpot" ? 13 : 14}
                  fontWeight={800}
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${mid + flip} ${lp.x} ${lp.y})`}
                  style={{ fontFamily: "var(--font-mono, monospace)", letterSpacing: "-0.02em" }}
                >
                  {s.label}
                </text>
              </g>
            );
          })}

          <circle cx={C} cy={C} r={26} fill="#131318" stroke="#3A3A45" strokeWidth={3} />
          <circle cx={C} cy={C} r={8} fill="var(--kop)" />
        </motion.svg>
      </div>

      <button
        onClick={handleSpin}
        disabled={!canSpin}
        className={[
          "rounded-[12px] px-8 py-3 text-[15px] font-bold transition-all",
          canSpin
            ? "bg-kop text-white hover:-translate-y-px hover:bg-kop-bright hover:shadow-[0_10px_30px_-10px_var(--kop)]"
            : "cursor-not-allowed bg-surface-2 text-text-3",
        ].join(" ")}
      >
        {phase === "spinning"
          ? "La roue tourne…"
          : available
            ? "Tourner la roue"
            : "Reviens demain"}
      </button>

      <AnimatePresence>
        {phase === "done" && result && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-[380px] rounded-[14px] border border-border bg-surface-1 p-5 text-center"
          >
            {result.segment.kind === "jackpot" && (
              <div className="mb-1 text-[13px] font-bold uppercase tracking-[0.15em] text-yellow">
                🎉 JACKPOT 🎉
              </div>
            )}
            <div className="mb-2 text-[14px] text-text-2">
              {result.delta > 0
                ? "Tu as gagné"
                : result.delta < 0
                  ? "Tu as perdu"
                  : "Pas de chance cette fois"}
            </div>
            {result.delta !== 0 && (
              <div className="flex items-center justify-center">
                <Kops
                  amount={result.delta}
                  sign
                  size={26}
                  color={result.delta > 0 ? "var(--green)" : "var(--kop-bright)"}
                />
              </div>
            )}
            <div className="mt-3 text-[12.5px] text-text-3">
              Reviens demain pour tourner à nouveau.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
