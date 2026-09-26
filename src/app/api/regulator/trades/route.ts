import { NextRequest, NextResponse } from 'next/server';
import { decryptJson } from '@/lib/crypto';
import { listTrades } from '@/lib/store';

export async function GET(req: NextRequest) {
  const key = req.headers.get('x-regulator-key');
  const expected = process.env.REGULATOR_DEMO_KEY || 'veiltrade-regulator-demo';
  if (key !== expected) return NextResponse.json({ error: 'unauthorized regulator key' }, { status: 401 });
  const trades = await listTrades();
  const disclosed = trades.map((t) => {
    let privateData: unknown = null;
    if (t.regulatorPayload) {
      try { privateData = decryptJson(t.regulatorPayload); } catch { privateData = null; }
    }
    return { ...t, regulatorPayload: undefined, privateData };
  });
  return NextResponse.json({ trades: disclosed });
}
