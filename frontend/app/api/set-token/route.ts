import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { access, refresh } = await req.json();
  const cookieStore = await cookies();
  
  cookieStore.set('access_token', access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 5,
  });

  cookieStore.set('refresh_token', refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
  });

  return Response.json({ ok: true });
}