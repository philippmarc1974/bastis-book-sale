'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { BookResponse } from '@/lib/db';
import { slugify } from '@/lib/slugify';
import { useCart } from '@/lib/cart-context';

export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const [bookId, setBookId] = useState<string | null>(null);
  const [book, setBook] = useState<BookResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { cartIds, toggleCart } = useCart();

  useEffect(() => {
    params.then((p) => setBookId(p.id));
  }, [params]);

  const fetchBook = useCallback(async () => {
    if (!bookId) return;
    try {
      const res = await fetch(`/api/books/${bookId}`);
      if (res.ok) setBook(await res.json());
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    if (bookId) fetchBook();
  }, [bookId, fetchBook]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-5xl animate-pulse">📖</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 gap-4">
        <p className="text-gray-400">Book not found.</p>
        <Link href="/" className="text-amber-600 underline">Back to shop</Link>
      </div>
    );
  }

  const seriesSlug = slugify(book.series_author_group);
  const isNotInCollection = book.status === 'not_in_collection';
  const inCart = cartIds.has(book.id);

  return (
    <div className="min-h-screen bg-amber-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200 shadow-sm">
        <div className="max-w-screen-md mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link href={`/series/${seriesSlug}`} className="text-amber-600 hover:text-amber-700 text-sm font-medium shrink-0">
            ← {book.series ?? 'Back'}
          </Link>
          <Link
            href="/"
            className="relative flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md shrink-0"
          >
            🛒
            {cartIds.size > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                {cartIds.size}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-8">
          {/* Large cover */}
          <div className="shrink-0 flex justify-center">
            <div className="relative w-52 sm:w-64 aspect-[2/3] rounded-xl overflow-hidden bg-amber-100 shadow-lg">
              {book.cover_url ? (
                <Image
                  src={book.cover_url}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="256px"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-amber-50 to-amber-100">
                  <span className="text-6xl mb-3">📖</span>
                  <span className="text-sm text-amber-800 font-medium leading-tight">{book.title}</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight leading-tight">{book.title}</h1>
              <p className="text-gray-500 mt-1">by {book.author}</p>
              {book.series && (
                <Link href={`/series/${seriesSlug}`} className="inline-block mt-1 text-sm text-amber-600 hover:text-amber-700">
                  {book.series}{book.series_number != null ? ` — Book ${book.series_number}` : ''}
                </Link>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-amber-100 text-amber-800 rounded-full px-3 py-1">{book.format}</span>
              {!isNotInCollection && (
                <span className={`text-xs rounded-full px-3 py-1 font-medium ${
                  book.condition === 'Good' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {book.condition} condition
                </span>
              )}
              <span className="text-xs bg-amber-100 text-amber-800 rounded-full px-3 py-1">{book.language}</span>
              {book.pages && (
                <span className="text-xs bg-amber-100 text-amber-800 rounded-full px-3 py-1">{book.pages} pages</span>
              )}
            </div>

            {/* Price & Status */}
            {!isNotInCollection && (
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold">${(book.price / 100).toFixed(2)} <span className="text-sm text-gray-400 font-normal">SGD</span></span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  book.status === 'available'
                    ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
                    : book.status === 'reserved'
                    ? 'bg-orange-100 text-orange-600 ring-1 ring-orange-200'
                    : 'bg-red-100 text-red-600 ring-1 ring-red-200'
                }`}>
                  {book.status === 'available' ? 'Available' : book.status === 'reserved' ? 'Reserved' : 'Sold'}
                </span>
              </div>
            )}
            {isNotInCollection && (
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-400">
                Not in collection
              </span>
            )}

            {/* Add to Cart button */}
            {book.status === 'available' && (
              <button
                onClick={() => toggleCart(book.id)}
                className={`text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 ${
                  inCart
                    ? 'bg-amber-100 text-amber-700 border border-amber-300'
                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                }`}
              >
                {inCart ? '✓ In Cart' : '+ Add to Cart'}
              </button>
            )}

            {/* Description */}
            {book.description && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Description</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{book.description}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
