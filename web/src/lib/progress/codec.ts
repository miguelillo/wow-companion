import { progressDocumentSchema, type ProgressDocument } from '../../schemas/progress';

/**
 * Export and import progress as one text string, for readers who want to move between
 * devices without signing in, and as the same wire format the addon writes into its
 * SavedVariables: raw deflate, then base64.
 *
 * `CompressionStream` is built into the browser, so this costs no dependency. Where it is
 * missing the string falls back to plain base64 under its own prefix, and both prefixes
 * are understood on import -- a longer string is better than a failed export.
 */
const PREFIX_DEFLATED = 'WCP1:';
const PREFIX_PLAIN = 'WCP1U:';

export async function exportProgress(document: ProgressDocument): Promise<string> {
  const json = JSON.stringify(document);
  const bytes = new TextEncoder().encode(json);

  const deflated = await deflate(bytes);
  return deflated === null
    ? `${PREFIX_PLAIN}${toBase64(bytes)}`
    : `${PREFIX_DEFLATED}${toBase64(deflated)}`;
}

/** Returns null for anything we cannot read, so the caller can say so plainly. */
export async function importProgress(text: string): Promise<ProgressDocument | null> {
  const trimmed = text.trim().replace(/\s+/g, '');

  let payload: string;
  let deflated: boolean;
  if (trimmed.startsWith(PREFIX_DEFLATED)) {
    payload = trimmed.slice(PREFIX_DEFLATED.length);
    deflated = true;
  } else if (trimmed.startsWith(PREFIX_PLAIN)) {
    payload = trimmed.slice(PREFIX_PLAIN.length);
    deflated = false;
  } else {
    return null;
  }

  try {
    const bytes = fromBase64(payload);
    const json = deflated ? await inflate(bytes) : bytes;
    if (json === null) return null;

    const parsed = progressDocumentSchema.safeParse(JSON.parse(new TextDecoder().decode(json)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function deflate(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer> | null> {
  if (typeof CompressionStream === 'undefined') return null;
  try {
    return await pump(new CompressionStream('deflate-raw'), bytes);
  } catch {
    return null;
  }
}

async function inflate(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer> | null> {
  if (typeof DecompressionStream === 'undefined') return null;
  try {
    return await pump(new DecompressionStream('deflate-raw'), bytes);
  } catch {
    return null;
  }
}

async function pump(
  transform: CompressionStream | DecompressionStream,
  bytes: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> {
  const writer = transform.writable.getWriter();
  void writer.write(bytes);
  void writer.close();

  const chunks: Uint8Array<ArrayBufferLike>[] = [];
  const reader = transform.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value !== undefined) chunks.push(value);
  }

  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

/** Chunked on purpose: spreading a large array into String.fromCharCode blows the stack. */
function toBase64(bytes: Uint8Array<ArrayBufferLike>): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
