import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { listInstitutions, setInstitutionEligibility } from '@/lib/store';

const Input = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  eligible: z.boolean(),
  kycLevel: z.number().int().min(0).max(4),
});

export async function GET(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || '';
  try {
    return NextResponse.json({ institutions: await listInstitutions(key) });
  } catch {
    return NextResponse.json({ error: 'unauthorized admin key' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || '';
  const parsed = Input.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const result = await setInstitutionEligibility(key, parsed.data.walletAddress, parsed.data.eligible, parsed.data.kycLevel);
    return NextResponse.json({ ok: true, result });
  } catch {
    return NextResponse.json({ error: 'unauthorized or invalid update' }, { status: 401 });
  }
}
