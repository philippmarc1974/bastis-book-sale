'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BookResponse } from '@/lib/db';
import { buildCartUrl } from '@/lib/whatsapp';
import { useCart } from '@/lib/cart-context';
import { CartPanel } from '@/components/CartPanel';

interface SeriesData {
  series_author_group: string;
  series: string | null;
  author: string;
  books: BookResponse[];
}

export default function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [data, setData] = useState<SeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const { cartIds, toggleCart, addToCart, clearCart, removeMany } = useCart();

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const fetchData = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/series/${slug}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) fetchData();
  }, [slug, fetchData]);

  // Cart books from ALL books the user may have added (not just this series)
  const [allBooks, setAllBooks] = useState<BookResponse[]>([]);
  useEffect(() => {
    fetch('/api/books').then((r) => r.json()).then(setAllBooks).catch(() => {});
  }, []);

  const cartBooks = useMemo(
    () => allBooks.filter((b) => cartIds.has(b.id)),
    [allBooks, cartIds]
  );

  const addAllAvailable = () => {
    if (!data) return;
    data.books.filter((b) => b.status === 'available').forEach((b) => addToCart(b.id));
  };

  const handleSend = async (name: string, number: string) => {
    if (cartBooks.length === 0) return;
    setSending(true);
    try {
      const res = await fetch('/api/books/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(cartIds) }),
      });
      if (!res.ok) {
        const d = await res.json();
        if (d.unavailableIds?.length) {
          alert('Some books are no longer available. Removing from cart.');
          removeMany(d.unavailableIds as number[]);
          await fetchData();
        }
        return;
      }
      window.open(buildCartUrl(cartBooks, name, number), '_blank');
      clearCart();
      setCartOpen(false);
      await fetchData();
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">📚</div>
          <p className="text-amber-800 text-lg">Loading series…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 gap-4">
        <p className="text-gray-400">Series not found.</p>
        <Link href="/" className="text-amber-600 underline">Back to shop</Link>
      </div>
    );
  }

  const availableBooks = data.books.filter((b) => b.status === 'available');

  return (
    <div className="min-h-screen bg-amber-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200 shadow-sm">
        <div className="max-w-screen-lg mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="text-amber-600 hover:text-amber-700 text-sm font-medium shrink-0">
              ← Back
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight truncate">
                {data.series ?? data.series_author_group}
              </h1>
              <p className="text-xs text-gray-400">by {data.author} · {availableBooks.length}/{data.books.length} available</p>
            </div>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md shrink-0"
          >
            🛒
            {cartIds.size > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                {cartIds.size}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 py-6 space-y-4">
        {/* Add All button */}
        {availableBooks.length > 1 && (
          <div className="flex justify-end">
            <button
              onClick={addAllAvailable}
              className="text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              + Add All {availableBooks.length} to Cart
            </button>
          </div>
        )}

        {/* Books */}
        <div className="space-y-3">
          {data.books.map((book) => {
            const isNotInCollection = book.status === 'not_in_collection';
            const available = book.status === 'available';
            const inCart = cartIds.has(book.id);

            return (
              <div
                key={book.id}
                className={`flex gap-4 rounded-xl border p-4 transition-all duration-200 ${
                  isNotInCollection
                    ? 'opacity-40 border-gray-200 bg-white/50'
                    : 'border-amber-200 bg-white hover:border-amber-300 shadow-sm'
                }`}
              >
                {/* Cover */}
                <Link href={`/book/${book.id}`} className="relative w-20 h-28 shrink-0 bg-amber-50 rounded-lg overflow-hidden">
                  {book.cover_url ? (
                    <Image
                      src={book.cover_url}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">📖</div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/book/${book.id}`}>
                        <h3 className="font-semibold text-gray-900 leading-tight hover:text-amber-700 transition-colors">
                          {book.series_number != null && (
                            <span className="text-amber-600 mr-1.5">#{book.series_number}</span>
                          )}
                          {book.title}{book.pages ? ` (${book.pages}p)` : ''}
                        </h3>
                      </Link>
                      <p className="text-xs text-gray-400">{book.author}</p>
                    </div>
                    {isNotInCollection && (
                      <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                        Not in collection
                      </span>
                    )}
                  </div>

                  {book.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{book.description}</p>
                  )}

                  <div className="flex items-center gap-2 mt-auto pt-1">
                    <span className="text-[10px] bg-amber-100 text-amber-700 rounded px-2 py-0.5">{book.format}</span>
                    {!isNotInCollection && (
                      <span className={`text-[10px] rounded px-2 py-0.5 font-medium ${
                        book.condition === 'Good' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {book.condition}
                      </span>
                    )}
                    {!isNotInCollection && (
                      <span className="text-sm font-bold text-gray-900 ml-auto">
                        ${(book.price / 100).toFixed(2)}
                      </span>
                    )}
                    {isNotInCollection ? (
                      <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 ml-auto">
                        Not in collection
                      </span>
                    ) : available ? (
                      <button
                        onClick={() => toggleCart(book.id)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                          inCart
                            ? 'bg-amber-100 text-amber-700 border border-amber-300'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        {inCart ? '✓ Added' : '+ Add'}
                      </button>
                    ) : (
                      <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400">
                        {book.status === 'reserved' ? 'Reserved' : 'Sold'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating cart button (mobile) */}
      {cartIds.size > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-amber-600 hover:bg-amber-700 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-xl transition-all duration-200 md:hidden"
        >
          🛒
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {cartIds.size}
          </span>
        </button>
      )}

      {/* Cart Panel */}
      {cartOpen && (
        <CartPanel
          cartBooks={cartBooks}
          onRemove={toggleCart}
          onClear={clearCart}
          onSend={handleSend}
          onClose={() => setCartOpen(false)}
          sending={sending}
        />
      )}
    </div>
  );
}
