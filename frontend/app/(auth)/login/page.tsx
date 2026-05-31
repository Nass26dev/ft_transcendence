"use client";

import api from '@/utils/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailFromUrl = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (emailFromUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync field when ?email= changes
      setEmail(emailFromUrl);
    }
  }, [emailFromUrl]);

  const handleSubmit = async () => {
    setError(null);
    try {
      const response = await api.post('/api/auth/login/', { email, password });
      const data = response.data;

      if (data['2fa_required']) {
        setUserId(data.user_id);
        setStep(2);
      }
    } catch (err) {
      const data = axios.isAxiosError(err) ? err.response?.data : null;
      setError(data || { detail: "Identifiants invalides." });
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    try {
      await axios.post('/api/auth/login', { user_id: userId, code: otpCode });
      router.push('/');
    } catch (err) {
      const data = axios.isAxiosError(err) ? err.response?.data : null;
      setError(data || { detail: "Code invalide ou expiré." });
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await api.post('/api/auth/social/google/', {
          access_token: tokenResponse.access_token,
        });
        // En mode JWT_AUTH_HTTPONLY, dj_rest_auth pose lui-même les cookies JWT
        // et ne renvoie PAS les tokens dans le body. On n'appelle set-token que
        // s'ils sont réellement présents, sinon on écraserait les bons cookies
        // avec des valeurs "undefined".
        if (res.data?.access && res.data?.refresh) {
          await fetch('/api/set-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access: res.data.access, refresh: res.data.refresh }),
          });
        }
        router.push('/');
      } catch (err) {
        setError({ detail: "Erreur lors de la connexion Google" });
      }
    },
    onError: () => setError({ detail: "Erreur Google" }),
  });

  const inputCls =
    "w-full rounded-[10px] border border-border bg-surface-2 px-3.5 py-3 text-[14px] text-text outline-none transition-colors placeholder:text-text-3 focus:border-kop";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4">
      {/* Glow d'ambiance */}
      <div className="pointer-events-none absolute left-1/2 top-[-10%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-kop/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-15%] right-[10%] h-[320px] w-[320px] rounded-full bg-blue/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-7 flex justify-center">
          <Image src="/full-logo.png" alt="Kop" width={150} height={45} priority />
        </div>

        {/* Carte */}
        <div className="rounded-[16px] border border-border bg-surface-1 p-7 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.7)]">
          <h1 className="font-display text-[24px] font-bold tracking-[-0.02em]">
            {step === 1 ? "Connexion" : "Vérification"}
          </h1>
          <p className="mt-1 text-[13.5px] text-text-3">
            {step === 1
              ? "Connecte-toi pour parier avec tes Kops."
              : <>Entre le code envoyé à <span className="font-semibold text-text-2">{email}</span>.</>}
          </p>

          {error && (
            <div className="mt-5 rounded-[10px] border border-kop/40 bg-kop/10 px-3.5 py-3 text-[13px] font-medium text-kop-bright">
              {error.error || error.detail || "Erreur"}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-4">
            {step === 1 ? (
              <>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  className="mt-1 w-full rounded-[10px] bg-kop px-5 py-3 text-[14.5px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-kop-bright hover:shadow-[0_8px_24px_-8px_var(--kop)]"
                >
                  Suivant
                </button>

                <div className="my-1 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">ou</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <button
                  onClick={() => loginWithGoogle()}
                  className="flex w-full items-center justify-center gap-3 rounded-[10px] border border-border bg-surface-2 px-5 py-3 text-[14px] font-semibold text-text transition-colors hover:border-border-strong hover:bg-surface-3"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continuer avec Google
                </button>

                <p className="mt-3 text-center text-[13px] text-text-3">
                  Pas encore de compte ?{' '}
                  <Link href="/register" className="font-semibold text-kop-bright hover:underline">
                    S&apos;inscrire
                  </Link>
                </p>
              </>
            ) : (
              <>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                  maxLength={6}
                  autoFocus
                  className="w-full rounded-[10px] border border-border bg-surface-2 px-3.5 py-3.5 text-center font-mono text-2xl font-bold tracking-[0.5em] text-text outline-none transition-colors placeholder:text-text-4 focus:border-kop"
                />
                <button
                  onClick={handleVerifyOtp}
                  className="w-full rounded-[10px] bg-kop px-5 py-3 text-[14.5px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-kop-bright hover:shadow-[0_8px_24px_-8px_var(--kop)]"
                >
                  Vérifier le code
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="text-center text-[13px] font-semibold text-text-3 transition-colors hover:text-text"
                >
                  ← Retour
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-[11.5px] text-text-4">
          Pas d&apos;argent réel. 100 % Kops, 100 % gloire.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-bg text-text-3">Chargement…</div>}>
      <LoginContent />
    </Suspense>
  );
}
