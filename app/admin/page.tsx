'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BookResponse } from '@/lib/db';

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'available' | 'reserved' | 'sold';

const STATUS_COLORS: Record<Status, string> = {
  available: 'bg-green-100 text-green-800 border-green-300',
  reserved:  'bg-orange-100 text-orange-800 border-orange-300',
  sold:      'bg-red-100 text-red-800 border-red-300',
};

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (pw: string) => Promise<string | null> }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const error = await onLogin(pw);
    setLoading(false);
    if (error) setErr(error);
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm border border-amber-100">
        <h1 className="font-serif text-2xl font-bold text-amber-900 mb-1 text-center">
          📚 Admin Panel
        </h1>
        <p className="text-xs text-gray-400 text-center mb-6">Basti&apos;s Book Sale</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Enter admin password"
            />
          </div>
          {err && <p className="text-red-500 text-sm">{err}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-700 hover:bg-amber-800 disabled:opacity-60
              text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ books }: { books: BookResponse[] }) {
  const available = books.filter((b) => b.status === 'available').length;
  const reserved  = books.filter((b) => b.status === 'reserved').length;
  const sold      = books.filter((b) => b.status === 'sold').length;
  const total     = books.reduce((s, b) => s + b.price, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {[
        { label: 'Total',      value: books.length, cls: 'bg-gray-50 text-gray-800' },
        { label: 'Available',  value: available,    cls: 'bg-green-50 text-green-800' },
        { label: 'Reserved',   value: reserved,     cls: 'bg-orange-50 text-orange-800' },
        { label: 'Sold',       value: sold,         cls: 'bg-red-50 text-red-800' },
        { label: 'Value (avail.)', value: `$${(total / 100).toFixed(0)}`, cls: 'bg-amber-50 text-amber-800' },
      ].map((s) => (
        <div key={s.label} className={`${s.cls} rounded-xl p-4 text-center`}>
          <div className="text-2xl font-bold">{s.value}</div>
          <div className="text-xs font-medium mt-1 opacity-70">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Books Table ──────────────────────────────────────────────────────────────

function BooksTable({
  books,
  authHeaders,
  onChanged,
}: {
  books: BookResponse[];
  authHeaders: Record<string, string>;
  onChanged: () => void;
}) {
  const [editPriceId, setEditPriceId] = useState<number | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [search, setSearch] = useState('');

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      (b.series ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const patch = async (id: number, body: Record<string, unknown>) => {
    await fetch(`/api/admin/books/${id}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    onChanged();
  };

  const commitPrice = async (id: number) => {
    const dollars = parseFloat(priceInput);
    if (!isNaN(dollars)) await patch(id, { price: Math.round(dollars * 100) });
    setEditPriceId(null);
  };

  const cycleCondition = (book: BookResponse) => {
    patch(book.id, { condition: book.condition === 'Good' ? 'Fair' : 'Good' });
  };

  const deleteBook = async (book: BookResponse) => {
    if (!confirm(`Delete "${book.title}"?`)) return;
    await fetch(`/api/admin/books/${book.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    onChanged();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-3">
        <h2 className="font-semibold text-gray-900">All Books</h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, author, series…"
          className="ml-auto text-sm border border-gray-200 rounded-lg px-3 py-1.5
            focus:outline-none focus:ring-2 focus:ring-amber-400 w-64"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Cover</th>
              <th className="px-4 py-3 text-left">Title / Author</th>
              <th className="px-4 py-3 text-left">Series</th>
              <th className="px-4 py-3 text-left">Format</th>
              <th className="px-4 py-3 text-left">Price ✏️</th>
              <th className="px-4 py-3 text-left">Condition</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((book) => (
              <tr key={book.id} className="hover:bg-amber-50/40">
                {/* Cover thumbnail */}
                <td className="px-4 py-2">
                  {book.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.cover_url}
                      alt=""
                      className="w-9 h-12 object-contain rounded shadow-sm"
                    />
                  ) : (
                    <div className="w-9 h-12 bg-amber-50 rounded flex items-center justify-center text-lg">
                      📚
                    </div>
                  )}
                </td>

                {/* Title / Author */}
                <td className="px-4 py-2 max-w-xs">
                  <div className="font-medium text-gray-900 truncate">{book.title}</div>
                  <div className="text-xs text-gray-400 truncate">{book.author}</div>
                </td>

                {/* Series */}
                <td className="px-4 py-2 text-xs text-amber-700 max-w-[140px] truncate">
                  {book.series
                    ? `${book.series}${book.series_number != null ? ` #${book.series_number}` : ''}`
                    : '—'}
                </td>

                {/* Format */}
                <td className="px-4 py-2 text-xs text-gray-500">{book.format}</td>

                {/* Price — click to edit inline */}
                <td className="px-4 py-2">
                  {editPriceId === book.id ? (
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      onBlur={() => commitPrice(book.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitPrice(book.id);
                        if (e.key === 'Escape') setEditPriceId(null);
                      }}
                      autoFocus
                      className="w-20 border border-amber-300 rounded px-2 py-1 text-sm
                        focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditPriceId(book.id);
                        setPriceInput((book.price / 100).toFixed(2));
                      }}
                      className="flex items-center gap-1 font-semibold text-gray-900
                        hover:text-amber-700 transition-colors group"
                      title="Click to edit price"
                    >
                      ${(book.price / 100).toFixed(2)}
                      <span className="text-gray-300 group-hover:text-amber-500 text-xs">✏️</span>
                    </button>
                  )}
                </td>

                {/* Condition — click to toggle */}
                <td className="px-4 py-2">
                  <button
                    onClick={() => cycleCondition(book)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors
                      hover:opacity-80 cursor-pointer
                      ${book.condition === 'Good'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
                    title="Click to toggle condition"
                  >
                    {book.condition}
                  </button>
                </td>

                {/* Status — dropdown */}
                <td className="px-4 py-2">
                  <select
                    value={book.status}
                    onChange={(e) => patch(book.id, { status: e.target.value })}
                    className={`text-xs px-2 py-1 rounded border cursor-pointer
                      focus:outline-none focus:ring-2 focus:ring-amber-400
                      ${STATUS_COLORS[book.status as Status]}`}
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>
                </td>

                {/* Actions */}
                <td className="px-4 py-2">
                  <button
                    onClick={() => deleteBook(book)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-gray-400 text-sm">No books found.</p>
        )}
      </div>
    </div>
  );
}

// ─── Add Book Form ────────────────────────────────────────────────────────────

function AddBookForm({
  authHeaders,
  onAdded,
}: {
  authHeaders: Record<string, string>;
  onAdded: () => void;
}) {
  const empty = {
    title: '', author: '', series_author_group: '', series_number: '',
    language: 'English', format: 'Paperback', condition: 'Good', price: '5.00',
  };
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('Adding book + fetching cover…');
    try {
      const res = await fetch('/api/admin/books', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:               form.title,
          author:              form.author,
          series_author_group: form.series_author_group,
          series_number:       form.series_number ? parseInt(form.series_number) : null,
          language:            form.language,
          format:              form.format,
          condition:           form.condition,
          price:               form.price ? Math.round(parseFloat(form.price) * 100) : 0,
        }),
      });
      if (res.ok) {
        setForm(empty);
        setMsg('✅ Book added!');
        onAdded();
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsg('❌ Failed to add book.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-900 mb-4">Add Single Book</h2>
      <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Field label="Title *" value={form.title} onChange={set('title')} required className="md:col-span-2" />
        <Field label="Author *" value={form.author} onChange={set('author')} required />
        <Field label="Series / Author Group" value={form.series_author_group} onChange={set('series_author_group')}
          placeholder="e.g. Rick Riordan — Percy Jackson" className="md:col-span-2" />
        <Field label="Series #" value={form.series_number} onChange={set('series_number')} type="number" />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Language</label>
          <select value={form.language} onChange={set('language')}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option>English</option><option>German</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Format</label>
          <select value={form.format} onChange={set('format')}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option>Hardcover</option><option>Paperback</option><option>Comic</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Condition</label>
          <select value={form.condition} onChange={set('condition')}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option>Good</option><option>Fair</option>
          </select>
        </div>
        <Field label="Price (SGD)" value={form.price} onChange={set('price')} type="number" step="0.50" min="0" />
        <div className="md:col-span-3 flex items-center gap-3">
          <button type="submit" disabled={loading}
            className="bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white
              font-medium px-5 py-2 rounded-lg text-sm transition-colors">
            {loading ? 'Adding…' : 'Add Book (+ Auto-fetch Cover)'}
          </button>
          {msg && <span className="text-sm text-gray-600">{msg}</span>}
        </div>
      </form>
    </div>
  );
}

function Field({
  label, value, onChange, required, className, type = 'text', placeholder, step, min,
}: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean; className?: string; type?: string; placeholder?: string;
  step?: string; min?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={onChange} required={required}
        placeholder={placeholder} step={step} min={min}
        className="w-full border border-gray-200 rounded px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-amber-400" />
    </div>
  );
}

// ─── Bulk Import ──────────────────────────────────────────────────────────────

function BulkImport({
  authHeaders,
  onImported,
}: {
  authHeaders: Record<string, string>;
  onImported: () => void;
}) {
  const [tsv, setTsv] = useState('');
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const COLS = ['Series / Author Group', 'Title', 'Author', 'Series #', 'Language', 'Format', 'Notes', 'Cover URL', 'Description'];

  const buildPreview = () => {
    const lines = tsv.trim().split('\n').filter(Boolean);
    if (!lines.length) return;
    // Auto-detect if first line is a header
    const firstLower = lines[0].toLowerCase();
    const hasHeader = firstLower.includes('title') || firstLower.includes('series');
    const dataLines = hasHeader ? lines.slice(1) : lines;
    const rows = dataLines.map((line) => {
      const parts = line.split('\t');
      const obj: Record<string, string> = {};
      COLS.forEach((col, i) => { obj[col] = (parts[i] ?? '').trim(); });
      return obj;
    }).filter((r) => r['Title']);
    setPreview(rows);
  };

  const confirmImport = async () => {
    if (!preview.length) return;
    setLoading(true);
    setMsg('');
    try {
      // Build books array from preview
      const books = preview.map((r, i) => ({
        row_number:          1000 + i,
        series_author_group: r['Series / Author Group'] ?? '',
        title:               r['Title'],
        author:              r['Author'] ?? '',
        series_number:       r['Series #'] ? parseInt(r['Series #']) : null,
        language:            r['Language'] || 'English',
        format:              r['Format'] || 'Paperback',
        notes:               r['Notes'] || null,
        cover_url:           r['Cover URL'] || null,
        description:         r['Description'] || null,
        price:               500,
        condition:           'Good',
      }));

      // Insert one by one via admin/books endpoint
      let added = 0;
      for (const book of books) {
        const res = await fetch('/api/admin/books', {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(book),
        });
        if (res.ok) added++;
      }
      setMsg(`✅ Imported ${added} books!`);
      setTsv('');
      setPreview([]);
      onImported();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-900 mb-1">Bulk Import</h2>
      <p className="text-xs text-gray-400 mb-3">
        Paste tab-separated rows. Columns (in order):{' '}
        <code className="bg-gray-100 px-1 rounded text-xs">
          Series/Author Group · Title · Author · Series# · Language · Format · Notes · Cover URL · Description
        </code>
      </p>
      <textarea
        value={tsv}
        onChange={(e) => setTsv(e.target.value)}
        rows={6}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono
          focus:outline-none focus:ring-2 focus:ring-amber-400 mb-3"
        placeholder="Paste TSV data here…"
      />
      <div className="flex items-center gap-3 mb-4">
        <button onClick={buildPreview} disabled={!tsv.trim()}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium
            px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
          Preview ({tsv.trim().split('\n').filter(Boolean).length} rows)
        </button>
        {preview.length > 0 && (
          <button onClick={confirmImport} disabled={loading}
            className="text-sm bg-amber-700 hover:bg-amber-800 disabled:opacity-50
              text-white font-medium px-4 py-1.5 rounded-lg transition-colors">
            {loading ? 'Importing…' : `Import ${preview.length} books`}
          </button>
        )}
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>

      {preview.length > 0 && (
        <div className="overflow-x-auto border border-gray-100 rounded-lg">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                {['Title', 'Author', 'Series / Author Group', 'Series #', 'Format'].map((c) => (
                  <th key={c} className="px-3 py-2 text-left font-medium">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {preview.slice(0, 20).map((r, i) => (
                <tr key={i}>
                  <td className="px-3 py-1.5">{r['Title']}</td>
                  <td className="px-3 py-1.5 text-gray-500">{r['Author']}</td>
                  <td className="px-3 py-1.5 text-amber-700">{r['Series / Author Group']}</td>
                  <td className="px-3 py-1.5">{r['Series #'] || '—'}</td>
                  <td className="px-3 py-1.5">{r['Format'] || 'Paperback'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.length > 20 && (
            <p className="text-xs text-gray-400 text-center py-2">…and {preview.length - 20} more</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Fetch Missing Covers ─────────────────────────────────────────────────────

function FetchCovers({
  books,
  authHeaders,
  onUpdated,
}: {
  books: BookResponse[];
  authHeaders: Record<string, string>;
  onUpdated: () => void;
}) {
  const missing = books.filter((b) => !b.cover_url);
  const [progress, setProgress] = useState('');
  const [running, setRunning] = useState(false);

  const fetchAll = async () => {
    setRunning(true);
    let done = 0;
    for (const book of missing) {
      setProgress(`${done + 1}/${missing.length}: "${book.title}"…`);
      try {
        const q = encodeURIComponent(`${book.title} ${book.author}`);
        const metaRes = await fetch(`/api/metadata?q=${q}`, { headers: authHeaders });
        if (metaRes.ok) {
          const { coverUrl } = await metaRes.json();
          if (coverUrl) {
            await fetch(`/api/admin/books/${book.id}`, {
              method: 'PATCH',
              headers: { ...authHeaders, 'Content-Type': 'application/json' },
              body: JSON.stringify({ cover_url: coverUrl }),
            });
          }
        }
      } catch {}
      done++;
      await new Promise((r) => setTimeout(r, 400));
    }
    setProgress(`Done — fetched covers for ${done} book(s).`);
    setRunning(false);
    onUpdated();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-900 mb-1">Fetch Missing Covers</h2>
      <p className="text-xs text-gray-400 mb-3">
        {missing.length === 0
          ? 'All books have cover images. ✅'
          : `${missing.length} book(s) are missing a cover image.`}
      </p>
      {progress && <p className="text-xs text-amber-700 mb-3">{progress}</p>}
      <button
        onClick={fetchAll}
        disabled={running || missing.length === 0}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white
          font-medium px-4 py-2 rounded-lg text-sm transition-colors"
      >
        {running ? 'Fetching…' : `Fetch ${missing.length} Missing Covers`}
      </button>
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin_token');
    if (saved) setToken(saved);
  }, []);

  const authHeaders: Record<string, string> = {
    'Authorization': `Bearer ${token ?? ''}`,
  };

  const fetchBooks = useCallback(async () => {
    setLoadingBooks(true);
    try {
      const res = await fetch('/api/books');
      setBooks(await res.json());
    } finally {
      setLoadingBooks(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchBooks();
  }, [token, fetchBooks]);

  const handleLogin = async (pw: string): Promise<string | null> => {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    if (!res.ok) return 'Invalid password.';
    const { token: tok } = await res.json();
    localStorage.setItem('admin_token', tok);
    setToken(tok);
    return null;
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  if (!token) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-amber-800 text-white px-6 py-4 sticky top-0 z-40 shadow">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-amber-200 hover:text-white text-sm transition-colors">
              ← Back to Shop
            </a>
            <h1 className="font-serif text-xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchBooks} disabled={loadingBooks}
              className="text-sm text-amber-200 hover:text-white disabled:opacity-50">
              {loadingBooks ? 'Loading…' : '↻ Refresh'}
            </button>
            <button onClick={logout} className="text-sm text-amber-200 hover:text-white">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        <StatsBar books={books} />
        <BooksTable books={books} authHeaders={authHeaders} onChanged={fetchBooks} />
        <AddBookForm authHeaders={authHeaders} onAdded={fetchBooks} />
        <BulkImport authHeaders={authHeaders} onImported={fetchBooks} />
        <FetchCovers books={books} authHeaders={authHeaders} onUpdated={fetchBooks} />
      </main>
    </div>
  );
}
