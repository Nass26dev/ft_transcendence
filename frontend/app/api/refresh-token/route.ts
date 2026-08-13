import axios from 'axios';
import { cookies } from 'next/headers';

/**
 * Renouvelle l'access token à partir du refresh_token en cookie. Cette route
 * s'exécute côté serveur (conteneur frontend) : on joint le backend via son
 * URL interne Docker (API_URL) et non NEXT_PUBLIC_API_URL, qui pointerait sur
 * le frontend lui-même.
 */
export async function POST() {
  const cookieStore = await cookies();
  const refresh = cookieStore.get('refresh_token')?.value;

  if (!refresh) {
    return Response.json({ error: 'No refresh token' }, { status: 401 });
  }

  const backendUrl = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

  try {
    const { data } = await axios.post(
      `${backendUrl}/api/auth/token/refresh/`,
      { refresh }
    );

    cookieStore.set('access_token', data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5,
    });

    return Response.json({ ok: true });

  } catch {
    return Response.json({ error: 'Refresh failed' }, { status: 401 });
  }
}