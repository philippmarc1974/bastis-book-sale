import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      { protocol: 'https', hostname: 'books.google.com' },
      { protocol: 'http',  hostname: 'books.google.com' },
      { protocol: 'https', hostname: 'books.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
