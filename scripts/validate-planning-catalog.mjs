import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validatePlanningCatalog } from '../apps/web/lib/recommendations/planning.ts';

const path = process.argv[2] ?? fileURLToPath(new URL('../data/catalog/farm-context/planning.empty.json', import.meta.url));
try {
  const content = await readFile(path);
  if (content.length > 1_000_000) throw new Error('Catalog exceeds the 1 MB authoring limit.');
  const catalog = validatePlanningCatalog(JSON.parse(content.toString('utf8')));
  const entries = [...catalog.seeds, ...catalog.calendar];
  console.log(`Valid ${catalog.schema_version} catalog: ${catalog.seeds.length} seed entries, ${catalog.calendar.length} calendar entries. ${entries.filter(entry => entry.rule.review.status === 'reviewed').length} entries declare reviewed status; this is not verification of expert approval or field eligibility.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Planning catalog validation failed.');
  process.exitCode = 1;
}
