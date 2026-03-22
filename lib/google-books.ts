export interface GBResult {
  coverUrl: string | null;
  description: string | null;
}

export async function fetchGoogleBooks(query: string): Promise<GBResult> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return { coverUrl: null, description: null };

    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return { coverUrl: null, description: null };

    const info = item.volumeInfo ?? {};
    const links = info.imageLinks ?? {};
    const raw: string | undefined =
      links.large ?? links.medium ?? links.thumbnail ?? links.smallThumbnail;

    return {
      coverUrl: raw ? raw.replace(/^http:\/\//, 'https://') : null,
      description: info.description ?? null,
    };
  } catch {
    return { coverUrl: null, description: null };
  }
}
