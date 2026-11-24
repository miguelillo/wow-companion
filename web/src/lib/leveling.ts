import type { CollectionEntry } from 'astro:content';
import { entryPath, type Locale } from '../i18n';
import { dungeonName } from '../data/dungeons';
import { getLocalizedEntries } from './collections';
import type { FactionRoute, RouteSegment } from '../components/islands/RoutePicker';

/**
 * Turns the route collection into what the picker needs: zone names resolved to links,
 * dungeon keys resolved to their English names.
 */
export async function factionRoutes(locale: Locale): Promise<FactionRoute[]> {
  const [routes, zones] = await Promise.all([
    getLocalizedEntries('levelingRoutes', locale),
    getLocalizedEntries('zones', locale),
  ]);

  const zoneByKey = new Map(zones.map((zone) => [zone.data.translationKey, zone]));

  return routes
    .map((route) => ({
      faction: route.data.faction,
      segments: route.data.segments.map((segment): RouteSegment => ({
        from: segment.from,
        to: segment.to,
        zones: segment.zones.flatMap((key) => {
          const zone = zoneByKey.get(key);
          return zone === undefined
            ? []
            : [{ name: zone.data.name, href: entryPath('leveling', zone.data.slug, locale) }];
        }),
        dungeons: segment.dungeons.map(dungeonName),
        steps: segment.steps,
      })),
    }))
    .sort((left, right) => left.faction.localeCompare(right.faction));
}

export interface ZoneRouteContext {
  readonly faction: 'alliance' | 'horde';
  readonly from: number;
  readonly to: number;
  readonly steps: CollectionEntry<'levelingRoutes'>['data']['segments'][number]['steps'];
}

/** The route bands that pass through a zone, so its page can show the real steps. */
export async function routeContextFor(
  locale: Locale,
  zoneKey: string,
): Promise<ZoneRouteContext[]> {
  const routes = await getLocalizedEntries('levelingRoutes', locale);

  return routes.flatMap((route) =>
    route.data.segments
      .filter((segment) => segment.zones.includes(zoneKey))
      .map((segment) => ({
        faction: route.data.faction,
        from: segment.from,
        to: segment.to,
        steps: segment.steps,
      })),
  );
}
