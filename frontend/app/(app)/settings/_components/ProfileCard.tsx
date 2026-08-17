import React from "react";
import axios from "axios";
import { Icon } from "@/components/ui/Icon";
import { useProfile } from "../../_components/ProfileProvider";
import { userInitials } from "@/utils/user";
import { Avatar } from "@/components/ui/Avatar";
import api from "@/utils/api";
import { Card, Field } from "./primitives";

/** Carte Profil : avatar (upload), identité et bio. */
export function ProfileCard() {
  const { profile, refreshProfile } = useProfile();

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

  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);

  /** Saisie en cours : lu dans l'effet ci-dessous sans le faire dépendre de `dirty`. */
  const isUserEditingRef = React.useRef(dirty);
  isUserEditingRef.current = dirty;

  React.useEffect(() => {
    if (!profile) return;
    const f = {
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      username: profile.username ?? "",
      bio: profile.bio ?? "",
    };
    setBaseline(f);
    if (!isUserEditingRef.current) setForm(f);
  }, [profile]);

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

  const initials = profile ? userInitials(profile) : "K";
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState<string | null>(null);

  /**
   * Valide puis envoie la nouvelle photo de profil (image, 5 Mo max) en multipart.
   * Réinitialise la valeur de l'input pour permettre de re-sélectionner le même fichier ensuite.
   */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
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

  return (
    <Card title="Profil">
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
            Image de 5 Mo max.
          </div>
          {avatarError && (
            <div className="mt-0.5 text-[11.5px] text-red-500">{avatarError}</div>
          )}
        </div>
      </div>

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
  );
}
