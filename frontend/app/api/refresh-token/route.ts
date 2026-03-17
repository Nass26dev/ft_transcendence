import axios from 'axios';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  const refresh = cookieStore.get('refresh_token')?.value;

  if (!refresh) {
    return Response.json({ error: 'No refresh token' }, { status: 401 });
  }

  try {
    const { data } = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/token/refresh/`,
      { refresh }
    );

    cookieStore.set('access_token', data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 5,
    });

    return Response.json({ ok: true });

  } catch {
    return Response.json({ error: 'Refresh failed' }, { status: 401 });
  }
}