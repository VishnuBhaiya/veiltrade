import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { buildTradeAccessAuthorization, isFresh } from '@/lib/auth-message';
import { listTradesForWallet } from '@/lib/store';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { walletAddress, requestId, issuedAt, signature } = body || {};
  if (![walletAddress, requestId, issuedAt, signature].every((v) => typeof v === 'string')) {
    return NextResponse.json({ error: 'invalid authorization payload' }, { status: 400 });
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress) || !isFresh(issuedAt)) {
    return NextResponse.json({ error: 'authorization expired or invalid' }, { status: 401 });
  }

  const message = buildTradeAccessAuthorization(walletAddress, requestId, issuedAt);
  const valid = await verifyMessage({
    address: walletAddress as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });
  if (!valid) return NextResponse.json({ error: 'wallet signature invalid' }, { status: 401 });

  return NextResponse.json({ trades: await listTradesForWallet(walletAddress) });
}
