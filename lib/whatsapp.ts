import type { BookResponse } from './db';

const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '6596731503';

function fmt(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function buildCartUrl(
  books: BookResponse[],
  buyerName?: string,
  buyerNumber?: string
): string {
  const total = books.reduce((s, b) => s + b.price, 0);
  const bookLines = books.map((b, i) => {
    const series = b.series
      ? ` [${b.series}${b.series_number != null ? ` #${b.series_number}` : ''}]`
      : '';
    return `${i + 1}. *${b.title}*${series} — $${fmt(b.price)} SGD`;
  });

  const greeting = buyerName
    ? `Hi! My name is ${buyerName}${buyerNumber ? `, my number is ${buyerNumber}` : ''}. I'd like to buy:`
    : `Hi! I'd like to buy these books from Basti's Book Sale:`;

  const lines = [
    greeting,
    ``,
    ...bookLines,
    ``,
    `*Total: $${fmt(total)} SGD*`,
    ``,
    `Please confirm!`,
  ];
  return `https://wa.me/${WA}?text=${encodeURIComponent(lines.join('\n'))}`;
}
