/**
 * Exports the step and progress contracts to shared/contracts as JSON Schema.
 *
 * The Zod schemas in src/schemas are the single source of truth. The .NET side of the
 * project (the API and the desktop client) reads these files, so the web and the client
 * cannot drift apart. Run `pnpm run contracts:export` after touching either schema and
 * commit the result: the generated files are versioned on purpose.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { CONTRACT_VERSION } from '../src/schemas/index';
import { stepSchema } from '../src/schemas/step';
import { characterProgressSchema, progressDocumentSchema } from '../src/schemas/progress';

const outputDirectory = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'shared',
  'contracts',
);

const contracts = {
  'step.schema.json': stepSchema,
  'character-progress.schema.json': characterProgressSchema,
  'progress.schema.json': progressDocumentSchema,
} as const;

await mkdir(outputDirectory, { recursive: true });

for (const [fileName, schema] of Object.entries(contracts)) {
  const jsonSchema = z.toJSONSchema(schema, { io: 'input' });
  const body = {
    $id: `https://wowcompanion/contracts/v${CONTRACT_VERSION}/${fileName}`,
    ...jsonSchema,
  };
  await writeFile(join(outputDirectory, fileName), `${JSON.stringify(body, null, 2)}\n`, 'utf8');
  console.log(`wrote ${fileName}`);
}

await writeFile(join(outputDirectory, 'VERSION'), `${CONTRACT_VERSION}\n`, 'utf8');
console.log(`contract version ${CONTRACT_VERSION}`);
