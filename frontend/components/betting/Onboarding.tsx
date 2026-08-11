"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { KCoin } from "@/components/ui/Kops";
import { overlayVariants, modalPanelVariants, EASE } from "@/components/ui/motion";

// ---------- Types ----------

type Accent = "logo" | "coin" | "league" | "fire";

interface OnboardingStep {
  title: string;
  body: string;
  accent: Accent;
}

interface OnboardingProps {
  onClose: () => void;
}

// ---------- Data ----------

const ONBOARDING: OnboardingStep[] = [
  {
    title: "Bienvenue sur Kop.",
    body: "Le pari sportif sans pognon. 100 % adrénaline, 0 % facture. Tu as 10 000 Kops pour démarrer — fais-les fructifier.",
    accent: "logo",
  },
  {
    title: "Parie en Kops, pas en euros.",
    body: "Place tes pronos sur les vrais matchs avec des cotes en temps réel. Gagne ou perds des Kops — la monnaie virtuelle de la plateforme. Aucun argent réel n'entre ni ne sort.",
    accent: "coin",
  },
  {
    title: "Défie tes potes.",
    body: "Crée des ligues privées, suis le feed des paris de tes amis, grimpe le classement chaque semaine. C'est la PlayStation des pronos.",
    accent: "league",
  },
  {
    title: "Prêt ?",
    body: "On t'a crédité 10 000 Kops. Tu sais ce qu'il te reste à faire.",
    accent: "fire",
  },
];

// ---------- Sub-renders ----------

function ArtLogo() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <img
        src="/assets/logo.png"
        alt=""
        className="w-32 drop-shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
      />
    </div>
  );
}

function ArtCoin() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-15 h-15 rounded-full bg-kop grid place-items-center font-display font-extrabold text-[28px] text-white shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
            style={{
              width: 60,
              height: 60,
              transform: `translateY(${i % 2 === 0 ? -8 : 8}px) rotate(${(i - 2) * 8}deg)`,
            }}
          >
            K
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtLeague() {
  const colors = ["#FF6B6B", "#4A8DFF", "#A3FF12", "#FFD60A", "#C9184A"];
  const letters = ["L", "M", "N", "K", "S"];

  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex">
        {colors.map((c, i) => (
          <div
            key={i}
            className="w-14 h-14 rounded-full border-[3px] border-surface-1 grid place-items-center font-display font-bold text-lg"
            style={{
              background: c,
              marginLeft: i > 0 ? -16 : 0,
              color: c === "#FFD60A" || c === "#A3FF12" ? "#000" : "#fff",
            }}
          >
            {letters[i]}
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtFire() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="font-display tnum flex items-center gap-2.5 text-white text-[80px] font-extrabold tracking-[-0.04em]">
        10K <KCoin size={56} />
      </div>
    </div>
  );
}

// ---------- Component ----------

export function Onboarding({ onClose }: OnboardingProps) {
  const [step, setStep] = React.useState<number>(0);
  const cur = ONBOARDING[step];
  const last = step === ONBOARDING.length - 1;

  const renderArt = () => {
    switch (cur.accent) {
      case "logo": return <ArtLogo />;
      case "coin": return <ArtCoin />;
      case "league": return <ArtLeague />;
      case "fire": return <ArtFire />;
    }
  };

  return (
    <motion.div
      variants={overlayVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="fixed inset-0 z-[200] grid place-items-center p-8 bg-black/80 backdrop-blur-md"
    >
      <motion.div
        variants={modalPanelVariants}
        className="w-full max-w-[540px] overflow-hidden rounded-[14px] border border-border-strong bg-surface-1 shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
      >
        {/* Image / accent area */}
        <div className="relative h-[220px] overflow-hidden bg-gradient-to-br from-kop-deep to-[#2A0808]">
          <AnimatePresence mode="wait">
            <motion.div
              key={cur.accent}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="absolute inset-0"
            >
              {renderArt()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Body */}
        <div className="px-8 py-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              <h2 className="font-display text-[28px] font-bold tracking-[-0.02em] mb-2.5">
                {cur.title}
              </h2>
              <p className="text-text-2 text-[14.5px] leading-[1.55] mb-4">
                {cur.body}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex gap-1.5 justify-center my-4">
            {ONBOARDING.map((_, i) => (
              <div
                key={i}
                className={
                  i === step
                    ? "h-1.5 w-[22px] rounded-[3px] bg-kop transition-all duration-200"
                    : "h-1.5 w-1.5 rounded-full bg-border-strong transition-all duration-200"
                }
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-between mt-6">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[12.5px] font-semibold rounded-md border border-border-strong text-text hover:bg-surface-1 transition-colors"
            >
              Passer
            </button>

            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="px-3 py-1.5 text-[12.5px] font-semibold rounded-md bg-surface-2 border border-border text-text hover:bg-surface-3 hover:border-border-strong transition-colors"
                >
                  Retour
                </button>
              )}
              {!last && (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-[12.5px] font-semibold rounded-md bg-kop text-white hover:bg-kop-bright hover:-translate-y-px hover:shadow-[0_6px_22px_-8px_var(--kop)] transition-all"
                >
                  Suivant <Icon name="arrow" size={12} stroke={2.4} />
                </button>
              )}
              {last && (
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-[12.5px] font-semibold rounded-md bg-kop text-white hover:bg-kop-bright hover:-translate-y-px hover:shadow-[0_6px_22px_-8px_var(--kop)] transition-all"
                >
                  Démarrer <Icon name="arrow" size={12} stroke={2.4} />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}