import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  WALLET_SESSION_COOKIE,
  encodeWalletSession,
  verifyWalletSession,
  type SignedWalletSession,
} from '@/lib/wallet-session';
import { isFresh } from '@/lib/auth-message';

const Input = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  requestId: z.string().min(8).max(128),
  issuedAt: z.string().min(10),
  origin: z.string().url(),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
});

export async function GET(req: NextRequest) {
  const session = await verifyWalletSession(
    req.cookies.get(WALLET_SESSION_COOKIE)?.value,
    req.nextUrl.origin,
  );

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    address: session.walletAddress,
    expiresAt: new Date(Date.parse(session.issuedAt) + 12 * 60 * 60_000).toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const parsed = Input.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const session: SignedWalletSession = parsed.data;
  if (session.origin !== req.nextUrl.origin) {
    return NextResponse.json({ error: 'origin mismatch' }, { status: 401 });
  }
  if (!isFresh(session.issuedAt, 5 * 60_000)) {
    return NextResponse.json({ error: 'sign-in request expired' }, { status: 401 });
  }

  const valid = await verifyWalletSession(encodeWalletSession(session), req.nextUrl.origin);
  if (!valid) return NextResponse.json({ error: 'wallet signature invalid' }, { status: 401 });

  const res = NextResponse.json({
    authenticated: true,
    address: session.walletAddress,
    expiresAt: new Date(Date.parse(session.issuedAt) + 12 * 60 * 60_000).toISOString(),
  });

  res.cookies.set(WALLET_SESSION_COOKIE, encodeWalletSession(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 12 * 60 * 60,
  });

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(WALLET_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}
