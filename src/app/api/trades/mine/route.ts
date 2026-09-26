import { NextRequest, NextResponse } from 'next/server';
import { listTrades } from '@/lib/store';
import { verifySession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = verifySession(req.cookies.get('veiltrade_session')?.value);
  if (!session) return NextResponse.json({ error: 'wallet login required' }, { status: 401 });
  const trades = (await listTrades()).filter((t) =>
    t.buyerWallet.toLowerCase() === session.address || t.sellerWallet.toLowerCase() === session.address
  );
  return NextResponse.json({ trades: trades.map(({ regulatorPayload, ...t }) => t) });
}
