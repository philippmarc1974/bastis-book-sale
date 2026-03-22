'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BookResponse } from '@/lib/db';
import { buildBuyNowUrl, buildCartUrl } from '@/lib/whatsapp';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = 'title' | 'author' | 'series' | 'status' | 'price';
type SortDir = 'asc' | 'desc';
const STATUS_ORDER = { available: 0, reserved: 1, sold: 2 } as const;

// ─── BookCard ─────────────────────────────────────────────────────────────────

function BookCard({
  book,
  inCart,
  onToggleCart,
  onBuyNow,
}: {
  book: BookResponse;
  inCart: boolean;
  onToggleCart: (id: number) => void;
  onBuyNow: (book: BookResponse) => void;
}) {
  const available = book.status === 'available';
  const reserved = book.status === 'reserved';
  const sold = book.status === 'sold';

  const statusBadge = available
    ? 'bg-green-100 text-green-800 ring-1 ring-green-300'
    : reserved
    ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-300'
    : 'bg-red-100 text-red-800 ring-1 ring-red-300';

  const statusLabel = available ? 'Available' : reserved ? 'Reserved' : 'Sold';

  return (
    // Card width ~192px → at 96dpi ≈ 5.1cm; aspect-[2/3] → height ≈ 288px ≈ 7.6cm
    <div
      className={`relative flex flex-col w-48 rounded-xl bg-white shadow-sm border border-amber-100
        transition-all duration-200
        ${available ? 'hover:shadow-md hover:-translate-y-0.5' : 'opacity-75'}`}
    >
      {/* Cart checkbox */}
      {available && (
        <label className="absolute top-2 left-2 z-20 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={inCart}
            onChange={() => onToggleCart(book.id)}
            className="sr-only"
          />
          <span
            className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors
              ${inCart
                ? 'bg-amber-700 border-amber-700'
                : 'bg-white/90 border-gray-300 hover:border-amber-500'}`}
          >
            {inCart && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </label>
      )}

      {/* Cover image — aspect-[2/3] ≈ 7.5cm tall */}
      <div className="relative w-full aspect-[2/3] bg-amber-50 rounded-t-xl overflow-hidden">
        {/* Status overlay for non-available */}
        {!available && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow
                ${reserved ? 'bg-orange-500' : 'bg-red-600'}`}
            >
              {statusLabel}
            </span>
          </div>
        )}

        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={book.title}
            fill
            className="object-contain p-1"
            sizes="192px"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
            <span className="text-4xl mb-1">📚</span>
            <span className="text-xs text-amber-700 font-medium leading-tight line-clamp-4">
              {book.title}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-2.5 gap-1">
        <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-gray-900">
          {book.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-1">{book.author}</p>
        {book.series && (
          <p className="text-xs text-amber-700 font-medium line-clamp-1">
            {book.series}
            {book.series_number != null ? ` #${book.series_number}` : ''}
          </p>
        )}

        {/* Badges row */}
        <div className="flex flex-wrap gap-1 mt-0.5">
          <span className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
            {book.format}
          </span>
          <span
            className={`text-[10px] rounded px-1.5 py-0.5 font-medium
              ${book.condition === 'Good'
                ? 'bg-green-50 text-green-700'
                : 'bg-yellow-50 text-yellow-700'}`}
          >
            {book.condition}
          </span>
          {book.language === 'German' && (
            <span className="text-[10px] bg-blue-50 text-blue-700 rounded px-1.5 py-0.5">DE</span>
          )}
        </div>

        {/* Price + status */}
        <div className="mt-auto pt-1 flex items-center justify-between">
          <span className="text-base font-bold text-gray-900">
            ${(book.price / 100).toFixed(2)}
          </span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusBadge}`}>
            {statusLabel}
          </span>
        </div>

        {available ? (
          <button
            onClick={() => onBuyNow(book)}
            className="mt-1.5 w-full text-xs font-semibold bg-amber-700 hover:bg-amber-800
              active:bg-amber-900 text-white py-1.5 rounded-lg transition-colors"
          >
            Buy Now
          </button>
        ) : (
          <div
            className={`mt-1.5 w-full text-xs font-semibold text-center py-1.5 rounded-lg
              ${reserved ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}
          >
            {statusLabel}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CartPanel ────────────────────────────────────────────────────────────────

function CartPanel({
  cartBooks,
  onRemove,
  onClear,
  onSend,
  sending,
}: {
  cartBooks: BookResponse[];
  onRemove: (id: number) => void;
  onClear: () => void;
  onSend: () => void;
  sending: boolean;
}) {
  if (cartBooks.length === 0) return null;
  const total = cartBooks.reduce((s, b) => s + b.price, 0);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-2xl shadow-2xl border border-amber-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-amber-700 text-white px-4 py-3">
        <span className="font-semibold text-sm">
          🛒 Cart ({cartBooks.length} {cartBooks.length === 1 ? 'book' : 'books'})
        </span>
        <button onClick={onClear} className="text-xs opacity-75 hover:opacity-100 underline">
          Clear
        </button>
      </div>

      {/* Items */}
      <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
        {cartBooks.map((b) => (
          <div key={b.id} className="flex items-center gap-2 px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{b.title}</p>
              {b.series && (
                <p className="text-[10px] text-amber-700 truncate">
                  {b.series}{b.series_number != null ? ` #${b.series_number}` : ''}
                </p>
              )}
            </div>
            <span className="text-xs font-semibold text-gray-800 shrink-0">
              ${(b.price / 100).toFixed(2)}
            </span>
            <button
              onClick={() => onRemove(b.id)}
              className="text-gray-300 hover:text-red-500 text-sm transition-colors shrink-0"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-amber-50">
        <span className="text-sm font-bold text-gray-900">
          Total: ${(total / 100).toFixed(2)}
        </span>
        <button
          onClick={onSend}
          disabled={sending}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700
            disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg
            transition-colors"
        >
          {sending ? 'Reserving…' : '💬 Send Cart'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'title',  label: 'Title' },
  { field: 'author', label: 'Author' },
  { field: 'series', label: 'Series' },
  { field: 'status', label: 'Availability' },
  { field: 'price',  label: 'Price' },
];

export default function ShopPage() {
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selSeries, setSelSeries] = useState<string[]>([]);
  const [selLang, setSelLang] = useState<string | null>(null);
  const [selFormat, setSelFormat] = useState<string | null>(null);
  const [availOnly, setAvailOnly] = useState(false);

  // Sort
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Cart
  const [cartIds, setCartIds] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState(false);

  // Fetch books
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

  // Derived
  const allSeries = useMemo(
    () => Array.from(new Set(books.map((b) => b.series).filter(Boolean) as string[])).sort(),
    [books]
  );

  const displayed = useMemo(() => {
    let out = books;
    if (selSeries.length > 0) out = out.filter((b) => b.series && selSeries.includes(b.series));
    if (selLang)   out = out.filter((b) => b.language === selLang);
    if (selFormat) out = out.filter((b) => b.format === selFormat);
    if (availOnly) out = out.filter((b) => b.status === 'available');

    return [...out].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title':  cmp = a.title.localeCompare(b.title); break;
        case 'author': cmp = a.author.localeCompare(b.author); break;
        case 'series': cmp = (a.series ?? 'zzz').localeCompare(b.series ?? 'zzz'); break;
        case 'status': cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]; break;
        case 'price':  cmp = a.price - b.price; break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [books, selSeries, selLang, selFormat, availOnly, sortField, sortDir]);

  const cartBooks = useMemo(() => books.filter((b) => cartIds.has(b.id)), [books, cartIds]);

  const toggleCart = (id: number) =>
    setCartIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleBuyNow = async (book: BookResponse) => {
    // Optimistic update
    setBooks((prev) => prev.map((b) => b.id === book.id ? { ...b, status: 'reserved' } : b));
    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'reserved' }),
      });
      if (!res.ok) {
        await fetchBooks();
        alert('This book was just reserved. Refreshing…');
        return;
      }
    } catch {
      await fetchBooks();
      return;
    }
    window.open(buildBuyNowUrl(book), '_blank');
  };

  const handleSendCart = async () => {
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
          alert(`Some books are no longer available. Removing from cart.`);
          setCartIds((prev) => {
            const next = new Set(prev);
            (data.unavailableIds as number[]).forEach((id) => next.delete(id));
            return next;
          });
          await fetchBooks();
        }
        return;
      }
      window.open(buildCartUrl(cartBooks), '_blank');
      setCartIds(new Set());
      await fetchBooks();
    } finally {
      setSending(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (field === sortField) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const toggleSeriesFilter = (s: string) =>
    setSelSeries((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-center text-amber-800">
          <div className="text-5xl mb-4 animate-bounce">📚</div>
          <p className="font-serif text-lg">Loading books…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-amber-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-amber-900">📚 Basti&apos;s Book Sale</h1>
            <p className="text-xs text-gray-500">Pre-loved books · Singapore</p>
          </div>
          {cartIds.size > 0 && (
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-amber-800 bg-amber-100 border border-amber-300 rounded-full px-3 py-1">
              🛒 {cartIds.size} in cart
            </div>
          )}
        </div>
      </header>

      {/* ── Controls ── */}
      <div className="max-w-screen-xl mx-auto px-4 pt-4 pb-2 space-y-3">
        {/* Sort bar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sort:</span>
          {SORT_OPTIONS.map(({ field, label }) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1
                ${sortField === field
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-amber-500'}`}
            >
              {label}
              {sortField === field && (
                <span className="text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-start gap-3 p-3 bg-white rounded-xl border border-amber-100 shadow-sm">
          {/* Series pills */}
          {allSeries.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs font-semibold text-gray-400 mr-1">Series:</span>
              {allSeries.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSeriesFilter(s)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors
                    ${selSeries.includes(s)
                      ? 'bg-amber-700 text-white border-amber-700'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-500'}`}
                >
                  {s}
                </button>
              ))}
              {selSeries.length > 0 && (
                <button
                  onClick={() => setSelSeries([])}
                  className="text-xs text-gray-400 hover:text-gray-600 ml-1 underline"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Language + Format + Available-only */}
          <div className="flex flex-wrap gap-2 items-center ml-auto">
            <span className="text-xs font-semibold text-gray-400">Lang:</span>
            {['English', 'German'].map((lang) => (
              <button
                key={lang}
                onClick={() => setSelLang(selLang === lang ? null : lang)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors
                  ${selLang === lang
                    ? 'bg-amber-700 text-white border-amber-700'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-500'}`}
              >
                {lang}
              </button>
            ))}
            <span className="text-xs font-semibold text-gray-400 ml-2">Format:</span>
            {['Hardcover', 'Paperback', 'Comic'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSelFormat(selFormat === fmt ? null : fmt)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors
                  ${selFormat === fmt
                    ? 'bg-amber-700 text-white border-amber-700'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-500'}`}
              >
                {fmt}
              </button>
            ))}
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={availOnly}
                onChange={(e) => setAvailOnly(e.target.checked)}
                className="rounded accent-amber-700"
              />
              Available only
            </label>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Showing {displayed.length} of {books.length} books
        </p>
      </div>

      {/* ── Book Grid ── */}
      <main className="max-w-screen-xl mx-auto px-4 pb-40">
        {displayed.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p>No books match your filters.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {displayed.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                inCart={cartIds.has(book.id)}
                onToggleCart={toggleCart}
                onBuyNow={handleBuyNow}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Cart Panel ── */}
      <CartPanel
        cartBooks={cartBooks}
        onRemove={toggleCart}
        onClear={() => setCartIds(new Set())}
        onSend={handleSendCart}
        sending={sending}
      />
    </div>
  );
}
