import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { fetchGoogleBooks } from '@/lib/google-books';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 });

  const result = await fetchGoogleBooks(q);
  return NextResponse.json(result);
}
