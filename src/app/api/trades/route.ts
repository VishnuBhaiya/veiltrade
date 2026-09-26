import { NextResponse } from 'next/server';
import { listPublicTrades } from '@/lib/store';

export async function GET() {
  return NextResponse.json({ trades: await listPublicTrades() });
}
