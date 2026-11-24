import { useEffect, useSyncExternalStore } from 'react';

import type { ProgressDocument } from '../../schemas/progress';
import {
  getServerSnapshot,
  getSnapshot,
  startCrossTabSync,
  subscribe,
} from '../../lib/progress/store';

/**
 * Every island on the page reads the same store, so ticking a step in one updates the
 * next-steps panel in another without either knowing the other exists.
 */
export function useProgress(): ProgressDocument {
  const document = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => startCrossTabSync(), []);

  return document;
}
