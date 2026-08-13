import { NextRequest, NextResponse } from 'next/server';

/** Relaie la vérification de connexion au backend et transmet les cookies Set-Cookie renvoyés. */
export async function POST(req: NextRequest) {
  const body = await req.json();

  const backendRes = await fetch(`${process.env.API_URL}/api/auth/login/verify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  const response = NextResponse.json({ user: data.user });
  backendRes.headers.getSetCookie().forEach(cookie => {
    response.headers.append('Set-Cookie', cookie);
  });

  return response;
}