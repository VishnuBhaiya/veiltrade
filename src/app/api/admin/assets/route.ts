import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { listAdminAssets, setAssetActive, upsertAsset } from '@/lib/store';

const AssetInput = z.object({
  id: z.string().regex(/^asset-[a-z0-9-]{2,40}$/),
  symbol: z.string().regex(/^[A-Za-z][A-Za-z0-9]{1,11}$/),
  name: z.string().min(3).max(80),
  description: z.string().max(280).optional(),
  issuer: z.string().max(80).optional(),
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().or(z.literal('')),
  decimals: z.number().int().min(0).max(30),
  assetType: z.enum(['RWA','STABLECOIN']),
  indicativePrice: z.number().positive(),
});

const StatusInput = z.object({
  id: z.string().min(1),
  active: z.boolean(),
});

export async function GET(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || '';
  try {
    return NextResponse.json({ assets: await listAdminAssets(key) });
  } catch {
    return NextResponse.json({ error: 'unauthorized admin key' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || '';
  const parsed = AssetInput.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const asset = await upsertAsset(key, parsed.data);
    return NextResponse.json({ ok: true, asset });
  } catch (error: any) {
    return NextResponse.json({ error: String(error?.message || 'unauthorized or invalid asset') }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || '';
  const parsed = StatusInput.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const result = await setAssetActive(key, parsed.data.id, parsed.data.active);
    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: String(error?.message || 'unauthorized or invalid update') }, { status: 400 });
  }
}
