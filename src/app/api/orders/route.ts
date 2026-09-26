import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashCommitment } from '@/lib/crypto';
import { createOrder, listOrders } from '@/lib/store';
import { WALLET_SESSION_COOKIE, verifyWalletSession } from '@/lib/wallet-session';

const OrderInput = z.object({
  assetId: z.string().min(1),
  side: z.enum(['BUY', 'SELL']),
  price: z.number().positive(),
  quantity: z.number().positive(),
  notes: z.string().max(280).optional(),
});

export async function GET() {
  return NextResponse.json({ orders: await listOrders() });
}

export async function POST(req: NextRequest) {
  const session = await verifyWalletSession(
    req.cookies.get(WALLET_SESSION_COOKIE)?.value,
    req.nextUrl.origin,
  );
  if (!session) return NextResponse.json({ error: 'Connect and sign in once first.' }, { status: 401 });

  const parsed = OrderInput.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const body = parsed.data;
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const commitment = hashCommitment({
    id,
    wallet: session.walletAddress.toLowerCase(),
    asset: body.assetId,
    side: body.side,
    price: body.price,
    quantity: body.quantity,
    notes: body.notes || '',
    createdAt,
  });

  try {
    const result = await createOrder({
      id,
      walletAddress: session.walletAddress,
      assetId: body.assetId,
      side: body.side,
      price: body.price,
      quantity: body.quantity,
      notes: body.notes,
      commitment,
      createdAt,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    const message = String(error?.message || error);
    const status = message.toLowerCase().includes('duplicate') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
