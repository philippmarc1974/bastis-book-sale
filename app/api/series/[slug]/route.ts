import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAllBooks } from '@/lib/db';
import { slugify } from '@/lib/slugify';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = getDb();
    const allBooks = getAllBooks(db);

    // Find the series_author_group that matches this slug
    const match = allBooks.find(
      (b) => slugify(b.series_author_group) === slug
    );

    if (!match) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    const seriesBooks = allBooks.filter(
      (b) => b.series_author_group === match.series_author_group
    );

    return NextResponse.json({
      series_author_group: match.series_author_group,
      series: match.series,
      author: match.author,
      books: seriesBooks,
    });
  } catch (err) {
    console.error('[GET /api/series/[slug]]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
