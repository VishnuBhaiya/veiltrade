import { NextResponse } from 'next/server';
import { listTrades } from '@/lib/store';

export async function GET() {
  const trades = await listTrades();
  return NextResponse.json({ trades: trades.map((t) => ({
    id: t.id, assetId: t.assetId, commitment: t.commitment, status: t.status,
    proofHash: t.proofHash, txHash: t.txHash, createdAt: t.createdAt,
    counterparties: 'PRIVATE', amount: 'PRIVATE', quantity: 'PRIVATE',
  })) });
}
