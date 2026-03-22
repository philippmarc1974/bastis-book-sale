import type { BookResponse } from './db';

const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '6596731503';

function fmt(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function buildBuyNowUrl(book: BookResponse): string {
  const series = book.series
    ? ` (${book.series}${book.series_number != null ? ` #${book.series_number}` : ''})`
    : '';
  const lines = [
    `Hi! I'd like to buy a book from Basti's Book Sale:`,
    ``,
    `📚 *${book.title}*${series}`,
    `   Author: ${book.author}`,
    `   Format: ${book.format} | Condition: ${book.condition}`,
    `   Price: $${fmt(book.price)} SGD`,
    ``,
    `Is it still available?`,
  ];
  return `https://wa.me/${WA}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildCartUrl(books: BookResponse[]): string {
  const total = books.reduce((s, b) => s + b.price, 0);
  const bookLines = books.map((b, i) => {
    const series = b.series
      ? ` [${b.series}${b.series_number != null ? ` #${b.series_number}` : ''}]`
      : '';
    return `${i + 1}. *${b.title}*${series} — $${fmt(b.price)} SGD`;
  });
  const lines = [
    `Hi! I'd like to buy these books from Basti's Book Sale:`,
    ``,
    ...bookLines,
    ``,
    `*Total: $${fmt(total)} SGD*`,
    ``,
    `Are they all still available?`,
  ];
  return `https://wa.me/${WA}?text=${encodeURIComponent(lines.join('\n'))}`;
}
