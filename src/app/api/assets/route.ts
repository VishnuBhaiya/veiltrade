import { NextResponse } from 'next/server';
import { listAssets } from '@/lib/store';

export async function GET() {
  try {
    return NextResponse.json({ assets: await listAssets() });
  } catch (error: any) {
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
