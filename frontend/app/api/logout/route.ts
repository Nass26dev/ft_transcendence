import { cookies } from 'next/headers';

/** Déconnexion : purge tous les cookies d'auth (JWT + session Django/allauth). */
export async function POST() {
  const cookieStore = await cookies();
  for (const name of ['access_token', 'refresh_token', 'sessionid', 'csrftoken', 'messages']) {
    cookieStore.delete(name);
  }
  return Response.json({ ok: true });
}
