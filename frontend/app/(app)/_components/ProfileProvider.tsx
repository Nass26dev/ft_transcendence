"use client";

import React from "react";
import axios from "axios";
import api from "@/utils/api";

export interface Profile {
  id: number;
  username: string;
  email: string;
  wallet: number;
  daily_bonus_available: boolean;
}

interface ProfileContextValue {
  profile: Profile | null;
  /** true si l'utilisateur est connecté (profil chargé). */
  isAuthenticated: boolean;
  /** false tant que le premier chargement du profil n'est pas terminé. */
  ready: boolean;
  /** Recharge le profil depuis l'API (ex: après un pari). */
  refreshProfile: () => Promise<void>;
  /** Récupère le bonus quotidien. Renvoie true si crédité. */
  claimDailyBonus: () => Promise<boolean>;
}

const ProfileContext = React.createContext<ProfileContextValue | null>(null);

/** Accès au profil partagé (wallet, bonus). À utiliser dans <ProfileProvider>. */
export function useProfile(): ProfileContextValue {
  const ctx = React.useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile doit être utilisé dans un <ProfileProvider>");
  }
  return ctx;
}

function normalize(data: Record<string, unknown>): Profile {
  return { ...(data as unknown as Profile), wallet: Number(data.wallet) };
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [ready, setReady] = React.useState(false);

  const refreshProfile = React.useCallback(async () => {
    try {
      const res = await api.get("/api/profile/");
      setProfile(normalize(res.data));
    } catch (err) {
      // 401 = visiteur non connecté : cas normal, on reste en mode invité.
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setProfile(null);
        return;
      }
      console.error("Erreur chargement profil:", err);
    } finally {
      setReady(true);
    }
  }, []);

  React.useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const claimDailyBonus = React.useCallback(async (): Promise<boolean> => {
    try {
      const res = await api.post("/api/daily-bonus/");
      setProfile(normalize(res.data));
      return true;
    } catch (err) {
      console.error("Erreur bonus quotidien:", err);
      return false;
    }
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isAuthenticated: profile !== null,
        ready,
        refreshProfile,
        claimDailyBonus,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
