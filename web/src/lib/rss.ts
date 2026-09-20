import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { sectionPath, useTranslations, type Locale } from '../i18n';
import { getPatches } from './collections';

/** The patches feed, one per language. Items link to their entry on the patches page. */
export async function patchesFeed(locale: Locale, context: APIContext): Promise<Response> {
  const t = useTranslations(locale);
  const patches = await getPatches(locale);
  const base = sectionPath('patches', locale);

  return rss({
    title: `${t('patches.title')} · ${t('site.name')}`,
    description: t('patches.meta.description'),
    site: context.site ?? 'http://localhost:4321',
    trailingSlash: false,
    items: patches.map((entry) => ({
      title: entry.data.title,
      pubDate: entry.data.date,
      description: entry.data.summary,
      link: `${base}#${entry.data.slug}`,
    })),
  });
}
