import { NextRequest, NextResponse } from 'next/server';
import { getDb, getBookById, releaseExpired, toResponse } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids[] required' }, { status: 400 });
    }

    const db = getDb();
    releaseExpired(db);

    // Check all books are available
    const unavailableIds: number[] = [];
    for (const id of ids) {
      const b = db.prepare('SELECT id, status FROM books WHERE id = ?').get(id) as
        | { id: number; status: string }
        | undefined;
      if (!b || b.status !== 'available') unavailableIds.push(id);
    }

    if (unavailableIds.length > 0) {
      return NextResponse.json(
        { error: 'Some books are no longer available', unavailableIds },
        { status: 409 }
      );
    }

    // Reserve all in transaction
    const now = new Date().toISOString();
    db.transaction((bookIds: number[]) => {
      const stmt = db.prepare(
        `UPDATE books SET status = 'reserved', reserved_at = ? WHERE id = ?`
      );
      for (const id of bookIds) stmt.run(now, id);
    })(ids);

    const reserved = ids.map((id: number) => getBookById(db, id)!);
    return NextResponse.json({ reserved });
  } catch (err) {
    console.error('[POST /api/books/reserve]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
