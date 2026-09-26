import { NextRequest, NextResponse } from 'next/server';
import { getDemoPortfolio } from '@/lib/store';
import { WALLET_SESSION_COOKIE, verifyWalletSession } from '@/lib/wallet-session';

export async function GET(req: NextRequest) {
  const session = await verifyWalletSession(
    req.cookies.get(WALLET_SESSION_COOKIE)?.value,
    req.nextUrl.origin,
  );
  if (!session) return NextResponse.json({ error: 'Connect and sign in once first.' }, { status: 401 });

  try {
    return NextResponse.json({
      walletAddress: session.walletAddress,
      mode: 'DEMO_SANDBOX',
      balances: await getDemoPortfolio(session.walletAddress),
    });
  } catch (error: any) {
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
