import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { z } from 'zod';
import { hashkeyTestnet } from '@/lib/hsk';
import { updateTradeProgress } from '@/lib/store';
import { WALLET_SESSION_COOKIE, verifyWalletSession } from '@/lib/wallet-session';

const Input = z.object({
  action: z.enum(['ALLOWANCE','ANCHOR','APPROVE','SETTLE']),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

const client = createPublicClient({
  chain: hashkeyTestnet,
  transport: http(process.env.NEXT_PUBLIC_HSK_RPC_URL || 'https://testnet.hsk.xyz'),
});

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await verifyWalletSession(
    req.cookies.get(WALLET_SESSION_COOKIE)?.value,
    req.nextUrl.origin,
  );
  if (!session) return NextResponse.json({ error: 'Wallet session expired. Sign in again.' }, { status: 401 });

  const parsed = Input.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { action, txHash } = parsed.data;
  try {
    const hash = txHash as `0x${string}`;
    const [tx, receipt] = await Promise.all([
      client.getTransaction({ hash }),
      client.getTransactionReceipt({ hash }),
    ]);

    if (receipt.status !== 'success') {
      return NextResponse.json({ error: 'transaction did not succeed on HSK' }, { status: 409 });
    }
    if (tx.from.toLowerCase() !== session.walletAddress.toLowerCase()) {
      return NextResponse.json({ error: 'transaction signer does not match signed-in wallet' }, { status: 401 });
    }

    const trade = await updateTradeProgress(session.walletAddress, id, action, txHash);
    return NextResponse.json({ ok: true, trade });
  } catch (error: any) {
    return NextResponse.json({ error: String(error?.shortMessage || error?.message || error) }, { status: 400 });
  }
}
