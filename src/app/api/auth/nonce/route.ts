import { NextRequest, NextResponse } from 'next/server';
import { buildLoginMessage, issueNonce } from '@/lib/nonces';

export async function POST(req: NextRequest) {
  const { address } = await req.json();
  if (!address || typeof address !== 'string') {
    return NextResponse.json({ error: 'address required' }, { status: 400 });
  }
  const nonce = issueNonce(address);
  const origin = req.nextUrl.origin;
  return NextResponse.json({ nonce, message: buildLoginMessage(address, nonce, origin) });
}
