/**
 * Shape of our own `/api/realm-status` endpoint, which caches Blizzard's realm and
 * connected-realm data for a few minutes.
 *
 * Hand-written rather than a Zod schema on purpose: this runs in the browser, and pulling
 * a validation library into the bundle to check six fields costs more than the twenty
 * lines below. The API side of the contract lives in api/WowCompanion.Api/Contracts.
 */
export type RealmPopulation = 'low' | 'medium' | 'high' | 'full';

export interface Realm {
  readonly name: string;
  readonly slug: string;
  readonly region: string;
  readonly online: boolean;
  /** Null when Blizzard does not report it for this realm. */
  readonly population: RealmPopulation | null;
  readonly hasQueue: boolean;
}

export interface RealmStatus {
  readonly updatedAt: string;
  readonly realms: readonly Realm[];
}

const POPULATIONS: readonly string[] = ['low', 'medium', 'high', 'full'];

function isRealm(value: unknown): value is Realm {
  if (typeof value !== 'object' || value === null) return false;
  const realm = value as Record<string, unknown>;

  return (
    typeof realm['name'] === 'string' &&
    realm['name'].length > 0 &&
    typeof realm['slug'] === 'string' &&
    typeof realm['region'] === 'string' &&
    typeof realm['online'] === 'boolean' &&
    typeof realm['hasQueue'] === 'boolean' &&
    (realm['population'] === null ||
      (typeof realm['population'] === 'string' && POPULATIONS.includes(realm['population'])))
  );
}

/** Returns null for anything that is not the answer we expect, so the card degrades. */
export function parseRealmStatus(value: unknown): RealmStatus | null {
  if (typeof value !== 'object' || value === null) return null;
  const payload = value as Record<string, unknown>;

  if (typeof payload['updatedAt'] !== 'string') return null;
  if (!Array.isArray(payload['realms'])) return null;
  if (!payload['realms'].every(isRealm)) return null;

  return { updatedAt: payload['updatedAt'], realms: payload['realms'] };
}
