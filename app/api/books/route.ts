import { NextResponse } from 'next/server';
import { getDb, getAllBooks } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const books = getAllBooks(getDb());
    return NextResponse.json(books);
  } catch (err) {
    console.error('[GET /api/books]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
