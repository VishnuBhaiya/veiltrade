import { NextRequest, NextResponse } from 'next/server';
import { listTradesForWallet } from '@/lib/store';
import { WALLET_SESSION_COOKIE, verifyWalletSession } from '@/lib/wallet-session';

export async function GET(req: NextRequest) {
  const session = await verifyWalletSession(
    req.cookies.get(WALLET_SESSION_COOKIE)?.value,
    req.nextUrl.origin,
  );
  if (!session) return NextResponse.json({ error: 'Connect and sign in once first.' }, { status: 401 });

  return NextResponse.json({ trades: await listTradesForWallet(session.walletAddress) });
}
