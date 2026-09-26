import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { consumeNonce } from '@/lib/nonces';
import { signSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const { address, message, signature, nonce } = await req.json();
  if (![address, message, signature, nonce].every((v) => typeof v === 'string')) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }
  if (!consumeNonce(address, nonce)) return NextResponse.json({ error: 'nonce invalid or expired' }, { status: 401 });
  const valid = await verifyMessage({ address: address as `0x${string}`, message, signature: signature as `0x${string}` });
  if (!valid) return NextResponse.json({ error: 'signature invalid' }, { status: 401 });

  const token = signSession({ address: address.toLowerCase(), exp: Date.now() + 12 * 60 * 60_000 });
  const res = NextResponse.json({ ok: true, address });
  res.cookies.set('veiltrade_session', token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 12 * 60 * 60,
  });
  return res;
}
