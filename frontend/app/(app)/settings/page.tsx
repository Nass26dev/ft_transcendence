"use client";

import React from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useProfile } from "../_components/ProfileProvider";
import { userInitials } from "@/utils/user";
import { Avatar } from "@/components/ui/Avatar";
import api from "@/utils/api";
import { applyReduceMotion } from "@/utils/prefs";

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

function Field({
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

function ToggleRow({
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

// ---------- Page ----------

export default function SettingsPage() {
  const { profile, isAuthenticated, ready, logout, refreshProfile } = useProfile();
  const router = useRouter();

  const [reduceMotion, setReduceMotion] = usePref("reduceMotion", false);

  // --- Édition du profil (prénom, nom, pseudo, bio) ---
  const [form, setForm] = React.useState({
    first_name: "",
    last_name: "",
    username: "",
    bio: "",
  });
  const [baseline, setBaseline] = React.useState(form);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [profileMsg, setProfileMsg] = React.useState<
    { type: "ok" | "err"; text: string } | null
  >(null);

  React.useEffect(() => {
    if (!profile) return;
    const f = {
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      username: profile.username ?? "",
      bio: profile.bio ?? "",
    };
    setForm(f);
    setBaseline(f);
  }, [profile]);

  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);

  const setField = (k: keyof typeof form) => (v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await api.patch("/api/profile/", form);
      await refreshProfile();
      setProfileMsg({ type: "ok", text: "Profil mis à jour." });
    } catch (err) {
      let text = "Échec de la mise à jour.";
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as Record<string, unknown>;
        const first =
          (Array.isArray(data.username) && data.username[0]) ||
          (typeof data.detail === "string" && data.detail);
        if (typeof first === "string") text = first;
      }
      setProfileMsg({ type: "err", text });
    } finally {
      setSavingProfile(false);
    }
  };

  // --- Profil public (champ backend) ---
  const [savingPublic, setSavingPublic] = React.useState(false);
  const handlePublicToggle = async (v: boolean) => {
    setSavingPublic(true);
    try {
      await api.patch("/api/profile/", { is_public: v });
      await refreshProfile();
    } catch {
      // silencieux : l'état se resynchronise au prochain chargement du profil.
    } finally {
      setSavingPublic(false);
    }
  };

  // --- Photo de profil ---
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState<string | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de re-sélectionner le même fichier ensuite
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Le fichier doit être une image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image trop lourde (max 5 Mo).");
      return;
    }
    setAvatarError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      // Override le Content-Type JSON par défaut : axios pose le bon
      // multipart/form-data (avec boundary) pour un FormData.
      await api.patch("/api/profile/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refreshProfile();
    } catch {
      setAvatarError("Échec de l'envoi. Réessaie.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (ready && !isAuthenticated) {
    return (
      <div className="max-w-[760px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
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
  const canAccessAdmin = profile?.status === "admin" || profile?.status === "owner";

  return (
    <div className="max-w-[760px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
      <h1 className="font-display text-[28px] font-bold tracking-[-0.02em]">
        Réglages
      </h1>
      <p className="mt-1 text-[13.5px] text-text-3">
        Gère ton compte et tes préférences.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {/* Profil */}
        <Card title="Profil">
          {/* Avatar + upload */}
          <div className="mb-5 flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Changer la photo"
              className="group relative flex-none rounded-full disabled:opacity-60"
            >
              <Avatar
                src={profile?.avatar}
                initials={initials}
                className="h-16 w-16 text-[20px]"
              />
              <span
                className={[
                  "absolute inset-0 grid place-items-center rounded-full bg-black/45 transition-opacity",
                  uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                ].join(" ")}
              >
                <Icon name="camera" size={20} stroke={1.8} />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-[13px] font-semibold text-kop-bright hover:underline disabled:opacity-60"
              >
                {uploading ? "Envoi…" : "Changer la photo"}
              </button>
              <div className="mt-0.5 text-[11.5px] text-text-3">
                JPG ou PNG, 5 Mo max.
              </div>
              {avatarError && (
                <div className="mt-0.5 text-[11.5px] text-red-500">{avatarError}</div>
              )}
            </div>
          </div>

          {/* Champs éditables */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Prénom" value={form.first_name} onChange={setField("first_name")} placeholder="Ton prénom" maxLength={150} />
            <Field label="Nom" value={form.last_name} onChange={setField("last_name")} placeholder="Ton nom" maxLength={150} />
          </div>
          <div className="mt-3.5">
            <Field label="Nom d'utilisateur" value={form.username} onChange={setField("username")} placeholder="pseudo" maxLength={150} />
          </div>
          <div className="mt-3.5">
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">
                Bio
              </span>
              <textarea
                value={form.bio}
                onChange={(e) => setField("bio")(e.target.value)}
                placeholder="Quelques mots sur toi…"
                rows={3}
                maxLength={500}
                className="w-full resize-none rounded-[10px] border border-border bg-surface-2 px-3.5 py-2.5 text-[13.5px] text-text outline-none transition-colors placeholder:text-text-3 focus:border-kop"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSaveProfile}
              disabled={!dirty || savingProfile}
              className="rounded-[10px] bg-kop px-4 py-2 text-[13px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-kop-bright disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {savingProfile ? "Enregistrement…" : "Enregistrer"}
            </button>
            {profileMsg && (
              <span
                className={[
                  "text-[12.5px] font-medium",
                  profileMsg.type === "ok" ? "text-green" : "text-red-500",
                ].join(" ")}
              >
                {profileMsg.text}
              </span>
            )}
          </div>
        </Card>

        {/* Compte (lecture seule) */}
        <Card title="Compte">
          <InfoRow label="Email" value={profile?.email ?? "—"} />
          <InfoRow
            label="Solde Kops"
            value={(profile?.wallet ?? 0).toLocaleString("fr-FR")}
          />
        </Card>

        {/* Préférences */}
        <Card title="Préférences">
          <ToggleRow
            label="Profil public"
            desc="Apparais dans les classements et le feed des amis."
            checked={profile?.is_public ?? true}
            onChange={handlePublicToggle}
            disabled={savingPublic}
          />
          <ToggleRow
            label="Animations réduites"
            desc="Limite les animations de l'interface."
            checked={reduceMotion}
            onChange={(v) => {
              setReduceMotion(v);
              applyReduceMotion(v);
            }}
          />
        </Card>

        {/* Session */}
        <Card title="Session">
          {canAccessAdmin && (
            <div className="flex items-center justify-between border-b border-border py-3.5">
              <div className="min-w-0 pr-4">
                <div className="text-[13.5px] font-medium text-text">
                  Administration
                </div>
                <div className="text-[12px] text-text-3">
                  Accéder au panneau d&apos;administration.
                </div>
              </div>

              <Link
                href="/settings/administration"
                className="flex flex-none items-center gap-2 rounded-[10px] border border-kop/40 bg-kop/10 px-4 py-2 text-[13px] font-semibold text-kop-bright transition-colors hover:bg-kop/20"
              >
                <Icon name="shield" size={15} stroke={2} />
                Admin Panel
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between pt-3.5">
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
