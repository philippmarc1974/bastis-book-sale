import type { BookResponse } from './db';

// Series groups to exclude entirely
const EXCLUDED_GROUPS = new Set([
  'Non-Fiction / Reference',
  'Murray Chandler — Chess',
]);

// Individual titles to exclude (non-fiction in standalone/other groups)
const EXCLUDED_TITLES = new Set([
  'Raising Boys',
  'The Dark Side of the Light Chasers',
  'You Are a Badass',
]);

export function isDisplayable(book: BookResponse): boolean {
  if (book.language !== 'English') return false;
  if (EXCLUDED_GROUPS.has(book.series_author_group)) return false;
  if (EXCLUDED_TITLES.has(book.title)) return false;
  return true;
}
