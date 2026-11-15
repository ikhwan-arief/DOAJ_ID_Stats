/**
 * Publisher routing and navigation helpers for DOAJ × SINTA Journal Observatory.
 *
 * Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
 * Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
 */

export function getPublisherProfileRoute(publisherId: string): string {
  return `#/publisher/${encodeURIComponent(publisherId)}`;
}

export function parsePublisherRoute(hash: string): string | null {
  const clean = hash.replace(/^#\/?/, '').trim();
  if (clean.startsWith('publisher/')) {
    const pubId = clean.slice('publisher/'.length).trim();
    return pubId ? decodeURIComponent(pubId) : null;
  }
  return null;
}
