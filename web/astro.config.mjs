// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { locales, defaultLocale, localeTags } from './src/i18n/config.ts';
import { sections, sectionPath } from './src/i18n/routes.ts';
import { pendingSections } from './src/data/pending-sections.ts';

const site = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';

/** Sections that are not written yet stay out of the sitemap, in every language. */
const pendingPaths = new Set(
  pendingSections.flatMap((section) => locales.map((locale) => sectionPath(section, locale))),
);

/**
 * Translated slugs mean the sitemap cannot pair a page with its sibling on its own:
 * `/parches` and `/en/patches` look unrelated. This maps every published section path to
 * the alternates it should declare.
 */
const sectionAlternateLinks = new Map(
  sections
    .filter((section) => !pendingSections.includes(section))
    .flatMap((section) =>
      locales.map((locale) => [
        sectionPath(section, locale),
        locales.map((alternate) => ({
          lang: localeTags[alternate],
          url: new URL(sectionPath(section, alternate), site).href,
        })),
      ]),
    ),
);

export default defineConfig({
  site,
  trailingSlash: 'never',
  i18n: {
    locales: [...locales],
    defaultLocale,
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    mdx(),
    // React only powers the interactive islands; every other page ships zero JS.
    react(),
    sitemap({
      i18n: {
        defaultLocale,
        locales: Object.fromEntries(locales.map((locale) => [locale, localeTags[locale]])),
      },
      filter: (page) => !pendingPaths.has(new URL(page).pathname.replace(/\/$/, '') || '/'),
      serialize: (item) => {
        const path = new URL(item.url).pathname.replace(/\/$/, '') || '/';
        const links = sectionAlternateLinks.get(path);
        return links === undefined ? item : { ...item, links };
      },
    }),
  ],
  build: {
    format: 'directory',
  },
  devToolbar: {
    enabled: false,
  },
});
