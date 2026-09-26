import { NextResponse } from 'next/server';
import { hasSupabase, getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const checks = {
    app: true,
    supabaseConfigured: hasSupabase(),
    supabaseReachable: false,
    hskRpcConfigured: Boolean(process.env.NEXT_PUBLIC_HSK_RPC_URL || 'https://testnet.hsk.xyz'),
    settlementContractConfigured: Boolean(process.env.NEXT_PUBLIC_SETTLEMENT_CONTRACT),
  };

  if (checks.supabaseConfigured) {
    try {
      const { error } = await getSupabaseAdmin().from('assets').select('id').limit(1);
      checks.supabaseReachable = !error;
    } catch {
      checks.supabaseReachable = false;
    }
  }

  return NextResponse.json({
    ok: checks.app && (!checks.supabaseConfigured || checks.supabaseReachable),
    checks,
    network: { name: 'HSKChain Testnet', chainId: 133 },
    timestamp: new Date().toISOString(),
  });
}
