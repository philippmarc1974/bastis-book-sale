import { NextRequest, NextResponse } from 'next/server';
import { getDb, toResponse } from '@/lib/db';
import { checkAdminAuth } from '@/lib/auth';
import { fetchGoogleBooks } from '@/lib/google-books';

export const dynamic = 'force-dynamic';

// POST: Add a single new book (auto-fetches Google Books cover if none provided)
export async function POST(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  const db = getDb();
  const body = await req.json();

  if (!body.title) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }

  // Auto-fetch cover/description from Google Books
  let coverUrl: string | null = body.cover_url ?? null;
  let description: string | null = body.description ?? null;
  if (!coverUrl) {
    const meta = await fetchGoogleBooks(`${body.title} ${body.author ?? ''}`);
    coverUrl = meta.coverUrl;
    if (!description) description = meta.description;
  }

  const { m } = db.prepare('SELECT MAX(row_number) as m FROM books').get() as { m: number | null };

  const result = db
    .prepare(
      `INSERT INTO books
         (row_number, series_author_group, title, author, series_number,
          language, format, notes, cover_url, description, price, condition, status)
       VALUES
         (@row_number, @sag, @title, @author, @series_number,
          @language, @format, @notes, @cover_url, @description, @price, @condition, 'available')`
    )
    .run({
      row_number:   (m ?? 0) + 1,
      sag:          body.series_author_group ?? '',
      title:        body.title,
      author:       body.author ?? '',
      series_number:body.series_number ?? null,
      language:     body.language ?? 'English',
      format:       body.format ?? 'Paperback',
      notes:        body.notes ?? null,
      cover_url:    coverUrl,
      description:  description,
      price:        body.price ?? 500,
      condition:    body.condition ?? 'Good',
    });

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(toResponse(book as Parameters<typeof toResponse>[0]), { status: 201 });
}

// POST bulk import via TSV — handled at /api/admin/books/bulk
