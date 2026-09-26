import { NextRequest, NextResponse } from 'next/server';
import { encryptJson, hashCommitment } from '@/lib/crypto';
import { matchOrders } from '@/lib/matching';
import { appendTrades, listOrders, replaceOrders } from '@/lib/store';
import { verifySession } from '@/lib/session';
import type { Trade } from '@/lib/types';

export async function POST(req: NextRequest) {
  const session = verifySession(req.cookies.get('veiltrade_session')?.value);
  if (!session) return NextResponse.json({ error: 'wallet login required' }, { status: 401 });
  const current = await listOrders();
  const result = matchOrders(current);
  await replaceOrders(result.orders);
  const trades: Trade[] = result.matches.map((m) => ({
    ...m,
    status: 'MATCHED',
    proofHash: hashCommitment({ commitment: m.commitment, matchedAt: m.createdAt }),
    regulatorPayload: encryptJson({ buyerWallet: m.buyerWallet, sellerWallet: m.sellerWallet, quantity: m.quantity, price: m.price, paymentAmount: m.paymentAmount }),
  }));
  if (trades.length) await appendTrades(trades);
  return NextResponse.json({ matched: trades.length, matches: trades.map((t) => ({ id: t.id, commitment: t.commitment, assetId: t.assetId, status: t.status })) });
}
