import { localeTags, type Locale } from '../i18n';

export function absoluteUrl(path: string, site: URL | undefined): string {
  const base = site?.origin ?? 'http://localhost:4321';
  return new URL(path, base).href;
}

export interface BreadcrumbStep {
  readonly name: string;
  readonly path: string;
}

/** BreadcrumbList for the navigation trail. Emitted on every page below the home page. */
export function breadcrumbSchema(steps: readonly BreadcrumbStep[], site: URL | undefined) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: steps.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.name,
      item: absoluteUrl(step.path, site),
    })),
  };
}

export interface ArticleSchemaInput {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly locale: Locale;
  readonly updated: Date;
  readonly published?: Date;
}

/** Article for guides and patch entries. */
export function articleSchema(input: ArticleSchemaInput, site: URL | undefined) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    inLanguage: localeTags[input.locale],
    url: absoluteUrl(input.path, site),
    datePublished: (input.published ?? input.updated).toISOString(),
    dateModified: input.updated.toISOString(),
  };
}
