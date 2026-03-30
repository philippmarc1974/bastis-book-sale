'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BookResponse } from '@/lib/db';
import { buildCartUrl } from '@/lib/whatsapp';
import { slugify } from '@/lib/slugify';
import { isDisplayable } from '@/lib/filters';
import { useCart } from '@/lib/cart-context';
import { CartPanel } from '@/components/CartPanel';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortMode = 'series' | 'author';

interface SeriesGroup {
  key: string;
  slug: string;
  seriesName: string;
  displayName: string;
  collectionLabel: string | null;
  author: string;
  books: BookResponse[];
  availableIds: number[];
  totalPrice: number;
  coverUrl: string | null;
}

// ─── SetCard ──────────────────────────────────────────────────────────────────

function SetCard({
  group,
  cartIds,
  onAddSet,
}: {
  group: SeriesGroup;
  cartIds: Set<number>;
  onAddSet: (ids: number[]) => void;
}) {
  const allInCart = group.availableIds.length > 0 && group.availableIds.every((id) => cartIds.has(id));

  return (
    <div className="relative flex flex-col w-56 rounded-xl bg-white border border-amber-100 shadow-md transition-all duration-200 hover:shadow-lg hover:border-amber-200 hover:-translate-y-0.5">
      {/* Cover — clickable to series page */}
      <Link href={`/series/${group.slug}`}>
        <div className="relative w-full aspect-[2/3] bg-amber-50 rounded-t-xl overflow-hidden">
          {group.coverUrl ? (
            <Image
              src={group.coverUrl}
              alt={group.seriesName}
              fill
              className="object-cover"
              sizes="224px"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-amber-50 to-amber-100">
              <span className="text-4xl mb-2">📖</span>
              <span className="text-xs text-amber-800 font-medium leading-tight">{group.displayName}</span>
            </div>
          )}
          {/* Book count overlay */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2.5">
            <span className="text-white text-xs font-semibold">{group.books.length} books</span>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <Link href={`/series/${group.slug}`}>
          <h3 className="text-sm font-bold leading-tight text-gray-900 hover:text-amber-700 transition-colors">{group.displayName}</h3>
        </Link>
        {group.collectionLabel && (
          <span className="inline-block self-start text-[10px] bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 font-semibold">
            {group.collectionLabel}
          </span>
        )}
        <p className="text-xs text-gray-500">{group.author}</p>

        {/* Book list with status dots — each title links to book detail */}
        <div className="space-y-1 mt-1">
          {group.books.map((b) => (
            <Link key={b.id} href={`/book/${b.id}`} className="flex items-center gap-2 text-xs group/item">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  b.status === 'available'
                    ? 'bg-green-500'
                    : b.status === 'reserved'
                    ? 'bg-orange-400'
                    : 'bg-red-400'
                }`}
              />
              <span className="truncate text-gray-600 leading-tight group-hover/item:text-amber-700 transition-colors">
                {b.series_number ? `#${b.series_number} ` : ''}{b.title}{b.pages ? ` (${b.pages}p)` : ''}
              </span>
            </Link>
          ))}
        </div>

        {/* Price + availability */}
        <div className="mt-auto pt-2 flex items-center justify-between border-t border-amber-100">
          <span className="text-xs text-gray-400">
            {group.availableIds.length}/{group.books.length} available
          </span>
          <span className="text-base font-bold text-gray-900">
            ${(group.totalPrice / 100).toFixed(0)}
          </span>
        </div>

        {/* Button */}
        {group.availableIds.length > 0 ? (
          <button
            onClick={() => onAddSet(group.availableIds)}
            className={`w-full text-xs font-semibold py-2 rounded-lg transition-all duration-200 ${
              allInCart
                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
            }`}
          >
            {allInCart ? '✓ Series Added' : '+ Add Series to Cart'}
          </button>
        ) : (
          <div className="w-full text-xs font-semibold text-center py-2 rounded-lg bg-gray-100 text-gray-400">
            Sold Out
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShopPage() {
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [selFormat, setSelFormat] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('series');

  const { cartIds, toggleCart, addSet, clearCart, removeMany } = useCart();
  const [sending, setSending] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch('/api/books');
      const data: BookResponse[] = await res.json();
      setBooks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
    const timer = setInterval(fetchBooks, 60_000);
    return () => clearInterval(timer);
  }, [fetchBooks]);

  const displayableBooks = useMemo(
    () => books.filter((b) => isDisplayable(b)),
    [books]
  );

  const seriesGroups = useMemo((): SeriesGroup[] => {
    const groups = new Map<string, BookResponse[]>();
    for (const book of displayableBooks) {
      const key = book.series_author_group;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(book);
    }
    return Array.from(groups.entries())
      .filter(([, bks]) => bks.some((b) => b.status !== 'not_in_collection'))
      .map(([key, bks]) => {
        const sorted = bks.sort((a, b) => (a.series_number ?? 999) - (b.series_number ?? 999));
        const available = sorted.filter((b) => b.status === 'available');
        const rawName = sorted[0].series ?? sorted[0].title;
        const collectionMatch = rawName.match(/\s*Collection\s*(\d*)/i);
        const displayName = collectionMatch ? rawName.replace(/\s*Collection\s*\d*/i, '').trim() || rawName : rawName;
        const collectionLabel = collectionMatch ? `Collection${collectionMatch[1] ? ` ${collectionMatch[1]}` : ''}` : null;
        return {
          key,
          slug: slugify(key),
          seriesName: rawName,
          displayName,
          collectionLabel,
          author: sorted[0].author,
          books: sorted,
          availableIds: available.map((b) => b.id),
          totalPrice: available.reduce((s, b) => s + b.price, 0),
          coverUrl: sorted.find((b) => b.cover_url)?.cover_url ?? null,
        };
      });
  }, [displayableBooks]);

  const displayed = useMemo(() => {
    let out = [...seriesGroups];
    if (selFormat) out = out.filter((g) => g.books.some((b) => b.format === selFormat));
    return out.sort((a, b) => {
      if (sortMode === 'series') return a.seriesName.localeCompare(b.seriesName);
      return a.author.localeCompare(b.author);
    });
  }, [seriesGroups, selFormat, sortMode]);

  const cartBooks = useMemo(() => books.filter((b) => cartIds.has(b.id)), [books, cartIds]);

  const handleSendCart = async (name: string, number: string) => {
    if (cartBooks.length === 0) return;
    setSending(true);
    try {
      const res = await fetch('/api/books/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(cartIds) }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (data.unavailableIds?.length) {
          alert('Some books are no longer available. Removing from cart.');
          removeMany(data.unavailableIds as number[]);
          await fetchBooks();
        }
        return;
      }
      window.location.href = buildCartUrl(cartBooks, name, number);
      clearCart();
      setCartOpen(false);
      await fetchBooks();
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">📚</div>
          <p className="text-amber-800 text-lg tracking-wide">Loading books…</p>
        </div>
      </div>
    );
  }

  const totalBooks = seriesGroups.reduce((s, g) => s + g.books.filter((b) => b.status !== 'not_in_collection').length, 0);

  return (
    <div className="min-h-screen bg-amber-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-amber-700">Basti&apos;s</span> Book Sale
            </h1>
            <p className="text-xs text-gray-400 tracking-wide">Pre-loved books · Singapore · {totalBooks} books</p>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md"
          >
            🛒 Cart
            {cartIds.size > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                {cartIds.size}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="max-w-screen-xl mx-auto px-4 pt-5 pb-3 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white rounded-lg p-0.5 border border-amber-200">
            <button onClick={() => setSortMode('series')}
              className={`text-xs px-4 py-2 rounded-md font-medium transition-all duration-200 ${sortMode === 'series' ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              By Series
            </button>
            <button onClick={() => setSortMode('author')}
              className={`text-xs px-4 py-2 rounded-md font-medium transition-all duration-200 ${sortMode === 'author' ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              By Author
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            {['Hardcover', 'Paperback'].map((fmt) => (
              <button key={fmt} onClick={() => setSelFormat(selFormat === fmt ? null : fmt)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${selFormat === fmt ? 'bg-amber-600 text-white border-amber-600' : 'text-gray-500 border-amber-200 hover:border-amber-400'}`}>
                {fmt}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 ml-auto">{displayed.length} series · {totalBooks} books</span>
        </div>

      </div>

      {/* Series cards grid */}
      <main className="max-w-screen-xl mx-auto px-4 pb-32">
        {displayed.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {displayed.map((group) => (
              <SetCard
                key={group.key}
                group={group}
                cartIds={cartIds}
                onAddSet={addSet}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p>No series match your filters.</p>
          </div>
        )}
      </main>

      {/* Floating cart button (mobile) */}
      {cartIds.size > 0 && !cartOpen && (
        <button onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-amber-600 hover:bg-amber-700 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-xl transition-all duration-200 md:hidden">
          🛒
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">{cartIds.size}</span>
        </button>
      )}

      {/* Footer with admin link */}
      <footer className="max-w-screen-xl mx-auto px-4 py-8 text-center">
        <Link href="/admin" className="text-xs text-gray-300 hover:text-gray-500 transition-colors">
          Admin
        </Link>
      </footer>

      {/* Cart Panel */}
      {cartOpen && (
        <CartPanel
          cartBooks={cartBooks}
          onRemove={toggleCart}
          onClear={clearCart}
          onSend={handleSendCart}
          onClose={() => setCartOpen(false)}
          sending={sending}
        />
      )}
    </div>
  );
}
