import {
  emptyProgressDocument,
  progressDocumentSchema,
  type ProgressDocument,
} from '../../schemas/progress';

const STORAGE_KEY = 'wow-companion:progress:v1';

/**
 * Local storage can be missing, blocked, full or hold something we did not write. Every
 * path here answers with a usable document instead of throwing: ticking a step has to
 * work for a reader who never signs in, and it must not break for one browsing privately.
 */
export function loadProgress(): ProgressDocument {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === null || raw === undefined) return emptyProgressDocument();

    const parsed = progressDocumentSchema.safeParse(JSON.parse(raw));
    // Corrupt or foreign data is ignored, not deleted: the next real write replaces it,
    // and until then we have not destroyed something we might have misread.
    return parsed.success ? parsed.data : emptyProgressDocument();
  } catch {
    return emptyProgressDocument();
  }
}

/** Returns false when the write did not happen, so callers can tell the reader. */
export function saveProgress(document: ProgressDocument): boolean {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(document));
    return true;
  } catch {
    return false;
  }
}

export function clearProgress(): void {
  try {
    globalThis.localStorage?.removeItem(STORAGE_KEY);
  } catch {
    /* Nothing to do: there was nothing we could write in the first place. */
  }
}

/** True when a write survives a read. Used to warn rather than to gate the UI. */
export function isStorageWritable(): boolean {
  try {
    const probe = `${STORAGE_KEY}:probe`;
    globalThis.localStorage?.setItem(probe, '1');
    globalThis.localStorage?.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export { STORAGE_KEY };
