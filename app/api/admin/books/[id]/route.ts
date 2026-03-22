import { NextRequest, NextResponse } from 'next/server';
import { getDb, getBookById } from '@/lib/db';
import { checkAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  const { id } = await params;
  const bookId = parseInt(id, 10);
  if (isNaN(bookId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const db = getDb();
  if (!getBookById(db, bookId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const allowed = ['price', 'condition', 'status', 'cover_url', 'description', 'notes'] as const;
  const sets: string[] = [];
  const vals: unknown[] = [];

  for (const field of allowed) {
    if (field in body) {
      sets.push(`${field} = ?`);
      vals.push(body[field]);
    }
  }

  // Handle reserved_at alongside status changes
  if ('status' in body) {
    sets.push('reserved_at = ?');
    vals.push(body.status === 'reserved' ? new Date().toISOString() : null);
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  vals.push(bookId);
  db.prepare(`UPDATE books SET ${sets.join(', ')} WHERE id = ?`).run(...vals);

  return NextResponse.json(getBookById(db, bookId));
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  const { id } = await params;
  const bookId = parseInt(id, 10);
  getDb().prepare('DELETE FROM books WHERE id = ?').run(bookId);
  return NextResponse.json({ deleted: bookId });
}
