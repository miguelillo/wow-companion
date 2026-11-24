import { parseRealmStatus, type RealmStatus } from './realm-status';

const apiBase = (import.meta.env.PUBLIC_API_URL ?? '').replace(/\/$/, '');

/**
 * Talks to our own API from the browser. It never throws and never rejects: a card that
 * cannot get data says so, and the page around it is already drawn. That is the whole
 * point of keeping the pages static.
 */
export async function fetchFromApi<T>(
  path: string,
  parse: (value: unknown) => T | null,
  timeoutMs = 4000,
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${apiBase}${path}`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!response.ok) return null;
    return parse(await response.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function fetchRealmStatus(): Promise<RealmStatus | null> {
  return fetchFromApi('/api/realm-status', parseRealmStatus);
}
