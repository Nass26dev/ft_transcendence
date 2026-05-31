"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useProfile } from "../_components/ProfileProvider";
import { userInitials } from "@/utils/user";

// ---------- Préférence persistée (localStorage) ----------

function usePref(key: string, initial: boolean): [boolean, (v: boolean) => void] {
  const [value, setValue] = React.useState<boolean>(initial);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(`kop.pref.${key}`);
    if (stored !== null) setValue(stored === "1");
  }, [key]);

  const update = React.useCallback(
    (v: boolean) => {
      setValue(v);
      window.localStorage.setItem(`kop.pref.${key}`, v ? "1" : "0");
    },
    [key],
  );

  return [value, update];
}

// ---------- Sous-composants ----------

function Card({
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
      <span className="text-[13px] text-text-3">{label}</span>
      <span className="text-[13.5px] font-medium text-text">{value}</span>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
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
        onClick={() => onChange(!checked)}
        className={[
          "inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors",
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

// ---------- Page ----------

export default function SettingsPage() {
  const { profile, isAuthenticated, ready, logout } = useProfile();
  const router = useRouter();

  const [emailNotif, setEmailNotif] = usePref("emailNotif", true);
  const [sounds, setSounds] = usePref("sounds", true);
  const [reduceMotion, setReduceMotion] = usePref("reduceMotion", false);
  const [publicProfile, setPublicProfile] = usePref("publicProfile", true);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (ready && !isAuthenticated) {
    return (
      <div className="max-w-[760px] px-8 pb-15 pt-7">
        <h1 className="mb-2 font-display text-[28px] font-bold tracking-[-0.02em]">
          Réglages
        </h1>
        <div className="mt-6 rounded-[10px] border border-border bg-surface-1 p-8 text-center">
          <p className="text-[14px] text-text-2">
            Connecte-toi pour accéder à tes réglages.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-[10px] bg-kop px-5 py-2.5 text-[13.5px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-kop-bright"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  const initials = profile ? userInitials(profile) : "K";

  return (
    <div className="max-w-[760px] px-8 pb-15 pt-7">
      <h1 className="font-display text-[28px] font-bold tracking-[-0.02em]">
        Réglages
      </h1>
      <p className="mt-1 text-[13.5px] text-text-3">
        Gère ton compte et tes préférences.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {/* Compte */}
        <Card title="Compte">
          <div className="mb-4 flex items-center gap-4">
            <div className="grid h-14 w-14 flex-none place-items-center rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#C9184A] text-[18px] font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold">
                {profile?.username ?? "—"}
              </div>
              <div className="truncate text-[12.5px] text-text-3">
                {profile?.email ?? ""}
              </div>
            </div>
            <Link
              href="/profile"
              className="ml-auto flex-none rounded-[10px] border border-border bg-surface-2 px-3.5 py-2 text-[12.5px] font-semibold text-text transition-colors hover:border-border-strong hover:bg-surface-3"
            >
              Voir le profil
            </Link>
          </div>
          <InfoRow label="Nom d'utilisateur" value={profile?.username ?? "—"} />
          <InfoRow label="Email" value={profile?.email ?? "—"} />
          <InfoRow
            label="Solde Kops"
            value={(profile?.wallet ?? 0).toLocaleString("fr-FR")}
          />
        </Card>

        {/* Préférences */}
        <Card title="Préférences">
          <ToggleRow
            label="Notifications par email"
            desc="Résultats de tes paris, défis, bonus quotidien."
            checked={emailNotif}
            onChange={setEmailNotif}
          />
          <ToggleRow
            label="Sons"
            desc="Effets sonores lors des paris et des gains."
            checked={sounds}
            onChange={setSounds}
          />
          <ToggleRow
            label="Animations réduites"
            desc="Limite les animations de l'interface."
            checked={reduceMotion}
            onChange={setReduceMotion}
          />
          <ToggleRow
            label="Profil public"
            desc="Apparais dans les classements et le feed des amis."
            checked={publicProfile}
            onChange={setPublicProfile}
          />
        </Card>

        {/* Session */}
        <Card title="Session">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-4">
              <div className="text-[13.5px] font-medium text-text">
                Déconnexion
              </div>
              <div className="text-[12px] text-text-3">
                Termine ta session sur cet appareil.
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex flex-none items-center gap-2 rounded-[10px] border border-kop/40 bg-kop/10 px-4 py-2 text-[13px] font-semibold text-kop-bright transition-colors hover:bg-kop/20"
            >
              <Icon name="swap" size={15} stroke={2} />
              Se déconnecter
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
