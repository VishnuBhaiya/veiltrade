import { NextRequest, NextResponse } from 'next/server';
import { regulatorTrades } from '@/lib/store';

export async function GET(req: NextRequest) {
  const key = req.headers.get('x-regulator-key') || '';
  try {
    return NextResponse.json({ trades: await regulatorTrades(key) });
  } catch {
    return NextResponse.json({ error: 'unauthorized regulator key' }, { status: 401 });
  }
}
