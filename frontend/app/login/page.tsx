"use client";

import api from '@/utils/api';
import { useRouter, useSearchParams } from 'next/navigation'; // Ajout de useSearchParams
import { useState, useEffect, Suspense } from 'react'; // Ajout de useEffect et Suspense
import { useGoogleLogin } from '@react-oauth/google';
import Image from 'next/image';
import Link from 'next/link';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const emailFromUrl = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (emailFromUrl) {
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
    } catch (err: any) {
      setError(err.response?.data || { detail: "Identifiants invalides." });
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    try {
      const response = await api.post('/api/auth/login/verify/', {
        user_id: userId,
        code: otpCode
      });

      const { access, refresh } = response.data;

      await fetch('/api/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access, refresh }),
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data || { detail: "Code invalide ou expiré." });
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await api.post('/api/auth/social/google/', {
          access_token: tokenResponse.access_token,
        });
        await fetch('/api/set-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access: res.data.access, refresh: res.data.refresh }),
        });
        router.push('/dashboard');
      } catch (err) {
        setError({ detail: "Erreur lors de la connexion Google" });
      }
    },
    onError: () => setError({ detail: "Erreur Google" }),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="flex justify-center mb-8">
          <Image src="/full-logo.png" alt="Logo" width={160} height={48} priority />
        </div>

        <h2 className="text-xl font-semibold mb-6 text-foreground text-center">
          {step === 1 ? "Se connecter" : "Vérification par email"}
        </h2>

        {error && (
          <div className="p-4 mb-6 rounded-md bg-red-100 text-red-800 border border-red-200">
            <p className="text-sm">{error.error || error.detail || "Erreur"}</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-md border border-neutral-300 bg-white outline-none text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 rounded-md border border-neutral-300 bg-white outline-none text-black"
                />
              </div>
              <button
                onClick={handleSubmit}
                className="w-full mt-1 p-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
              >
                Suivant
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-neutral-300" />
                <span className="text-xs text-neutral-500">ou</span>
                <div className="flex-1 h-px bg-neutral-300" />
              </div>

              <button
                onClick={() => loginWithGoogle()}
                className="w-full p-3 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 font-medium transition flex items-center justify-center gap-3"
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Se connecter avec Google
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-neutral-600">
                  Pas encore de compte ?{' '}
                  <Link 
                    href="/register" 
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    S'inscrire
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-neutral-600 text-center mb-2">
                Entrez le code envoyé à <strong>{email}</strong>
              </p>
              <div>
                <input
                  type="text"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={6}
                  className="w-full p-3 text-center text-2xl tracking-[0.5em] font-bold rounded-md border border-neutral-300 bg-white outline-none text-black"
                />
              </div>
              <button
                onClick={handleVerifyOtp}
                className="w-full mt-1 p-3 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium transition"
              >
                Vérifier le code
              </button>
              <button 
                onClick={() => setStep(1)} 
                className="text-sm text-blue-600 hover:underline mt-2"
              >
                Retour
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <LoginContent />
    </Suspense>
  );
}