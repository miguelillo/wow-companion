import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  classSchema,
  dungeonSchema,
  guideSchema,
  levelingRouteSchema,
  patchSchema,
  professionSchema,
  zoneSchema,
} from './schemas/content';

/**
 * Collection names and folders are English; only the slug inside each entry is translated.
 * Entries are grouped by language folder (`es/`, `en/`) and share one schema, so an id is
 * `<lang>/<slug>` — without the language prefix, sibling translations of a zone would
 * collide, since zone slugs are the same in every language.
 */
function localizedGlob(directory: string, extension: 'mdx' | 'yaml') {
  return glob({
    pattern: `**/*.${extension}`,
    base: `./src/content/${directory}`,
    generateId: ({ entry, data }) => {
      const [lang] = entry.split('/');
      const fileName = entry.split('/').pop() ?? entry;
      const slug = typeof data.slug === 'string' ? data.slug : fileName.replace(/\.[^.]+$/, '');
      return lang === undefined ? slug : `${lang}/${slug}`;
    },
  });
}

export const collections = {
  zones: defineCollection({ loader: localizedGlob('zones', 'mdx'), schema: zoneSchema }),
  professions: defineCollection({
    loader: localizedGlob('professions', 'mdx'),
    schema: professionSchema,
  }),
  dungeons: defineCollection({ loader: localizedGlob('dungeons', 'mdx'), schema: dungeonSchema }),
  classes: defineCollection({ loader: localizedGlob('classes', 'mdx'), schema: classSchema }),
  levelingRoutes: defineCollection({
    loader: localizedGlob('levelingRoutes', 'yaml'),
    schema: levelingRouteSchema,
  }),
  patches: defineCollection({ loader: localizedGlob('patches', 'mdx'), schema: patchSchema }),
  guides: defineCollection({ loader: localizedGlob('guides', 'mdx'), schema: guideSchema }),
};
