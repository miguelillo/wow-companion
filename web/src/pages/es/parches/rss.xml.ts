import type { APIContext } from 'astro';
import { patchesFeed } from '../../../lib/rss';

export const GET = (context: APIContext): Promise<Response> => patchesFeed('es', context);
