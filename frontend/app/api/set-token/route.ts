import { cookies } from 'next/headers';

/** Pose les cookies httpOnly access_token/refresh_token (ex: après le flux OAuth Google). */
export async function POST(req: Request) {
  const { access, refresh } = await req.json();
  const cookieStore = await cookies();
  
  cookieStore.set('access_token', access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 5,
  });

  cookieStore.set('refresh_token', refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  return Response.json({ ok: true });
}