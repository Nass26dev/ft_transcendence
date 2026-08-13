import React from "react";
import { useProfile } from "../../_components/ProfileProvider";
import api from "@/utils/api";
import { applyReduceMotion } from "@/utils/prefs";
import { Card, ToggleRow } from "./primitives";
import { usePref } from "./usePref";

/** Carte Préférences : visibilité du profil et animations réduites. */
export function PreferencesCard() {
  const { profile, refreshProfile } = useProfile();
  const [reduceMotion, setReduceMotion] = usePref("reduceMotion", false);
  const [savingPublic, setSavingPublic] = React.useState(false);

  /** Bascule la visibilité du profil ; en cas d'échec, l'état se resynchronise silencieusement au prochain chargement du profil. */
  const handlePublicToggle = async (v: boolean) => {
    setSavingPublic(true);
    try {
      await api.patch("/api/profile/", { is_public: v });
      await refreshProfile();
    } catch {
    } finally {
      setSavingPublic(false);
    }
  };

  return (
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
  );
}
