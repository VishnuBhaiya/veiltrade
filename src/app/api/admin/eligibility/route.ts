import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { publicInstitutions, setInstitutionEligibility } from '@/lib/store';

const Input = z.object({ walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/), eligible: z.boolean(), kycLevel: z.number().int().min(0).max(4) });

export async function GET() {
  return NextResponse.json({ institutions: publicInstitutions });
}

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-admin-key');
  if (key !== (process.env.ADMIN_DEMO_KEY || 'veiltrade-admin-demo')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = Input.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const result = await setInstitutionEligibility(parsed.data.walletAddress, parsed.data.eligible, parsed.data.kycLevel);
  return NextResponse.json({ ok: true, result });
}
