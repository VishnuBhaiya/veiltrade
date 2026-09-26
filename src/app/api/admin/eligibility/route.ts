import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { listInstitutions, setInstitutionEligibility } from '@/lib/store';

const Input = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  eligible: z.boolean(),
  kycLevel: z.number().int().min(0).max(4),
});

function expectedAdminKey() {
  const configured = process.env.ADMIN_DEMO_KEY;
  if (configured) return configured;
  return process.env.NODE_ENV === 'development' ? 'veiltrade-admin-demo' : null;
}

export async function GET() {
  return NextResponse.json({ institutions: await listInstitutions() });
}

export async function POST(req: NextRequest) {
  const expected = expectedAdminKey();
  if (!expected) return NextResponse.json({ error: 'admin access is not configured' }, { status: 503 });
  if (req.headers.get('x-admin-key') !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const parsed = Input.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const result = await setInstitutionEligibility(parsed.data.walletAddress, parsed.data.eligible, parsed.data.kycLevel);
  return NextResponse.json({ ok: true, result });
}
