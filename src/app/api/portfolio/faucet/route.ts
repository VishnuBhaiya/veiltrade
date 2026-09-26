import { NextRequest, NextResponse } from 'next/server';
import { getDemoPortfolio, topUpDemoPortfolio } from '@/lib/store';
import { WALLET_SESSION_COOKIE, verifyWalletSession } from '@/lib/wallet-session';

export async function POST(req: NextRequest) {
  const session = await verifyWalletSession(
    req.cookies.get(WALLET_SESSION_COOKIE)?.value,
    req.nextUrl.origin,
  );
  if (!session) return NextResponse.json({ error: 'Connect and sign in once first.' }, { status: 401 });

  try {
    const result = await topUpDemoPortfolio(session.walletAddress);
    return NextResponse.json({
      ok: true,
      result,
      balances: await getDemoPortfolio(session.walletAddress),
    });
  } catch (error: any) {
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
