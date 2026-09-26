import { NextRequest, NextResponse } from 'next/server';
import { decryptJson } from '@/lib/crypto';
import { listTrades, writeAuditLog } from '@/lib/store';

function expectedRegulatorKey() {
  const configured = process.env.REGULATOR_DEMO_KEY;
  if (configured) return configured;
  return process.env.NODE_ENV === 'development' ? 'veiltrade-regulator-demo' : null;
}

export async function GET(req: NextRequest) {
  const expected = expectedRegulatorKey();
  if (!expected) return NextResponse.json({ error: 'regulator access is not configured' }, { status: 503 });
  if (req.headers.get('x-regulator-key') !== expected) {
    return NextResponse.json({ error: 'unauthorized regulator key' }, { status: 401 });
  }

  const trades = await listTrades();
  const disclosed = trades.map((t) => {
    let privateData: unknown = null;
    if (t.regulatorPayload) {
      try { privateData = decryptJson(t.regulatorPayload); } catch { privateData = null; }
    }
    return { ...t, regulatorPayload: undefined, privateData };
  });

  await writeAuditLog('regulator-console', 'SELECTIVE_DISCLOSURE', undefined, { tradeCount: disclosed.length });
  return NextResponse.json({ trades: disclosed });
}
