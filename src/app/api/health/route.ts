import { NextResponse } from 'next/server';
import { listOrders } from '@/lib/store';

export async function GET() {
  let supabaseReachable = false;
  try {
    await listOrders();
    supabaseReachable = true;
  } catch {
    supabaseReachable = false;
  }

  return NextResponse.json({
    ok: supabaseReachable,
    checks: {
      app: true,
      supabaseConfigured: true,
      supabaseReachable,
      hskRpcConfigured: true,
      settlementContractConfigured: Boolean(process.env.NEXT_PUBLIC_SETTLEMENT_CONTRACT),
    },
    network: { name: 'HSKChain Testnet', chainId: 133 },
    timestamp: new Date().toISOString(),
  });
}
