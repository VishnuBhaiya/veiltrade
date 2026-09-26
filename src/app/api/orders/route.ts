import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyMessage } from 'viem';
import { buildOrderAuthorization, isFresh } from '@/lib/auth-message';
import { hashCommitment } from '@/lib/crypto';
import { createOrder, listOrders } from '@/lib/store';

const OrderInput = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  requestId: z.string().min(8).max(128),
  issuedAt: z.string().min(10),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
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
  const parsed = OrderInput.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  if (!isFresh(body.issuedAt)) return NextResponse.json({ error: 'authorization expired' }, { status: 401 });

  const message = buildOrderAuthorization(body);
  const valid = await verifyMessage({
    address: body.walletAddress as `0x${string}`,
    message,
    signature: body.signature as `0x${string}`,
  });
  if (!valid) return NextResponse.json({ error: 'wallet signature invalid' }, { status: 401 });

  const commitment = hashCommitment({
    id: body.requestId,
    wallet: body.walletAddress.toLowerCase(),
    asset: body.assetId,
    side: body.side,
    price: body.price,
    quantity: body.quantity,
    notes: body.notes || '',
    createdAt: body.issuedAt,
  });

  try {
    const order = await createOrder({
      id: body.requestId,
      walletAddress: body.walletAddress,
      assetId: body.assetId,
      side: body.side,
      price: body.price,
      quantity: body.quantity,
      notes: body.notes,
      commitment,
      createdAt: body.issuedAt,
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    const message = String(error?.message || error);
    const status = message.toLowerCase().includes('duplicate') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
