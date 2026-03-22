import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Basti's Book Sale",
  description: 'Browse and buy pre-loved books from Basti\'s collection. Singapore.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
