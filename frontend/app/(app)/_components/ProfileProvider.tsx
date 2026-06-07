"use client";

import React from "react";
import axios from "axios";
import api, { AUTH_EXPIRED_EVENT } from "@/utils/api";

export interface Profile {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  date_joined?: string;
  wallet: number;
  daily_bonus_available: boolean;
  onboarding_completed: boolean;
  status?: "owner" | "admin" | "user";
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
  /** Marque l'onboarding comme terminé (flag backend, ne se réaffiche plus). */
  completeOnboarding: () => Promise<void>;
  /** Déconnecte l'utilisateur : purge les cookies et repasse en mode invité. */
  logout: () => Promise<void>;
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

  const completeOnboarding = React.useCallback(async (): Promise<void> => {
    // Optimiste : on masque l'onboarding tout de suite, puis on persiste le flag.
    setProfile((prev) =>
      prev ? { ...prev, onboarding_completed: true } : prev,
    );
    try {
      const res = await api.post("/api/onboarding/complete/");
      setProfile(normalize(res.data));
    } catch (err) {
      console.error("Erreur fin onboarding:", err);
    }
  }, []);

  const logout = React.useCallback(async (): Promise<void> => {
    try {
      await axios.post("/api/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Erreur déconnexion:", err);
    } finally {
      setProfile(null);
    }
  }, []);

  // Session morte (refresh impossible) : on purge les cookies périmés une seule
  // fois et on repasse en invité, ce qui stoppe la boucle de 401.
  const loggingOut = React.useRef(false);
  React.useEffect(() => {
    const onExpired = () => {
      if (loggingOut.current) return;
      loggingOut.current = true;
      logout().finally(() => {
        loggingOut.current = false;
      });
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [logout]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isAuthenticated: profile !== null,
        ready,
        refreshProfile,
        claimDailyBonus,
        completeOnboarding,
        logout,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
