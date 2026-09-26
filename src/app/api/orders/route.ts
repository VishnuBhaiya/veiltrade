import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createOrder, listOrders } from '@/lib/store';
import { verifySession } from '@/lib/session';

const OrderInput = z.object({
  assetId: z.string().min(1),
  side: z.enum(['BUY', 'SELL']),
  price: z.number().positive(),
  quantity: z.number().positive(),
  notes: z.string().max(280).optional(),
});

export async function GET() {
  const orders = await listOrders();
  return NextResponse.json({ orders: orders.map((o) => ({
    id: o.id, assetId: o.assetId, side: o.side, price: o.price, quantity: o.quantity,
    remainingQuantity: o.remainingQuantity, commitment: o.commitment, status: o.status, createdAt: o.createdAt,
  })) });
}

export async function POST(req: NextRequest) {
  const session = verifySession(req.cookies.get('veiltrade_session')?.value);
  if (!session) return NextResponse.json({ error: 'wallet login required' }, { status: 401 });
  const parsed = OrderInput.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const order = await createOrder({ ...parsed.data, walletAddress: session.address });
  return NextResponse.json({ order }, { status: 201 });
}
