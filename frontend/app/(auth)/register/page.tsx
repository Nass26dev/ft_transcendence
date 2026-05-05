"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState<Record<string, any> | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/registration/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password1, password2 }),
        });

        const data = await response.json();

        if (!response.ok) {
            setError(data);
            return;
        }
        setSuccess(true);
        
        setTimeout(() => {
            router.push('/login');
        }, 4000);

    } catch (err) {
        setError({ detail: "Impossible de joindre le serveur Django." });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Créer un compte</h2>

      {success && (
        <div className="p-4 mb-6 rounded-md bg-green-100 text-green-800 border border-green-200 text-center">
          <p className="font-bold">Compte créé avec succès !</p>
          <p className="text-sm">Redirection vers la page de connexion...</p>
        </div>
      )}

      {}
      {error && (
        <div className="p-4 mb-6 rounded-md bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 overflow-x-auto">
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {}
      {!success && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Email :</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full p-2.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Mot de passe :</label>
            <input 
              type="password" 
              value={password1} 
              onChange={(e) => setPassword1(e.target.value)} 
              required 
              className="w-full p-2.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Confirmer le mot de passe :</label>
            <input 
              type="password" 
              value={password2} 
              onChange={(e) => setPassword2(e.target.value)} 
              required 
              className="w-full p-2.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <button 
            type="submit" 
            className="w-full mt-2 p-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition duration-200"
          >
            S'inscrire
          </button>
        </form>
      )}
    </div>
  );
}