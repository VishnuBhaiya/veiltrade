import { NextResponse } from 'next/server';
import { runMatching } from '@/lib/store';

export async function POST() {
  try {
    const matched = await runMatching();
    return NextResponse.json({ matched });
  } catch (error: any) {
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
