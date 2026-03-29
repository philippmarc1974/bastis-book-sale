import { NextRequest, NextResponse } from 'next/server';
import { getDb, getBookById, releaseExpired } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id, 10);
    if (isNaN(bookId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const db = getDb();
    releaseExpired(db);
    const book = getBookById(db, bookId);
    if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(book);
  } catch (err) {
    console.error('[GET /api/books/[id]]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Public PATCH: buyers can only reserve (not sold/available — admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id, 10);
    if (isNaN(bookId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await req.json();
    if (body.status !== 'reserved') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getDb();
    releaseExpired(db);

    const book = getBookById(db, bookId);
    if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (book.status !== 'available') {
      return NextResponse.json({ error: `Book is ${book.status}` }, { status: 409 });
    }

    db.prepare(
      `UPDATE books SET status = 'reserved', reserved_at = ? WHERE id = ?`
    ).run(new Date().toISOString(), bookId);

    return NextResponse.json(getBookById(db, bookId));
  } catch (err) {
    console.error('[PATCH /api/books/[id]]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
