import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { emptyData, makeBackup, parseBackup, planImport, removeField, validateData, validateDate } from '../lib/domain/farm.ts';
import { loadFarm, saveFarm, StorageConflict } from '../lib/storage/farm-store.ts';

const meta = id => ({ id, schema_version: 1, created_at: '2026-10-05T12:00:00.000Z', updated_at: '2026-10-05T12:00:00.000Z', origin: 'demo' });
const fixture = () => ({ schema_version: 1,
  farms: [{ ...meta('farm-demo'), name: 'Synthetic demo farm', language: 'en', timezone: 'Asia/Kolkata' }],
  fields: [{ ...meta('field-demo'), farm_id: 'farm-demo', name: 'Synthetic field', region: null, area: null, water: 'unknown', location: { latitude: 0, longitude: 0, accuracy_m: null, method: 'manual', confirmed_at: '2026-10-05T12:00:00.000Z' } }],
  cycles: [{ ...meta('cycle-demo'), field_id: 'field-demo', crop: 'Synthetic crop', variety: null, status: 'planned', sowing_date: null, stage: null, stage_recorded_at: null, season: null }]
});

test('coordinates are excluded from backups by default without altering device data', () => {
  const data = fixture(), backup = makeBackup(data);
  assert.equal(backup.includes_coordinates, false); assert.equal(backup.data.fields[0].location, null);
  assert.equal(data.fields[0].location.latitude, 0);
  assert.equal(parseBackup(JSON.stringify(backup)).data.fields[0].location, null);
  assert.equal(makeBackup(data, true).data.fields[0].location.latitude, 0);
});
test('unknown versions, hidden coordinates, broken references and duplicates reject import', () => {
  const backup = makeBackup(fixture(), true);
  for (const corrupt of [
    { ...backup, schema_version: 5 },
    { ...backup, includes_coordinates: false },
    { ...backup, data: { ...backup.data, farms: [] } },
    { ...backup, data: { ...backup.data, cycles: [...backup.data.cycles, ...backup.data.cycles] } }
  ]) assert.throws(() => parseBackup(JSON.stringify(corrupt)));
  assert.throws(() => parseBackup('{broken'));
  assert.throws(() => parseBackup(' '.repeat(2 * 1024 * 1024 + 1)), /smaller/);
});
test('reject impossible dates, nonfinite coordinates, invalid area and stage inconsistencies', () => {
  assert.equal(validateDate(null), null); assert.equal(validateDate('2024-02-29'), '2024-02-29');
  assert.throws(() => validateDate('2026-02-29')); assert.throws(() => validateDate('2026-13-01'));
  for (const location of [{ latitude: 91 }, { longitude: Infinity }, { accuracy_m: -1 }]) {
    const data = fixture(); Object.assign(data.fields[0].location, location); assert.throws(() => validateData(data));
  }
  const data = fixture(); data.fields[0].area = { value: 0, unit: 'ha' }; assert.throws(() => validateData(data));
  const invalid = fixture(); invalid.cycles[0].stage = 'flowering'; assert.throws(() => validateData(invalid));
});
test('duplicate backup is idempotent; conflicts require an explicit choice', () => {
  const current = fixture(), same = planImport(current, structuredClone(current));
  assert.equal(same.additions, 0); assert.deepEqual(same.conflicts, []);
  const incoming = fixture(); incoming.fields[0].name = 'Changed synthetic field';
  const pending = planImport(current, incoming); assert.equal(pending.conflicts.length, 1); assert.equal(pending.merged.fields[0].name, current.fields[0].name);
  assert.equal(planImport(current, incoming, 'device').merged.fields[0].name, current.fields[0].name);
  assert.equal(planImport(current, incoming, 'backup').merged.fields[0].name, incoming.fields[0].name);
  assert.equal(current.fields[0].name, 'Synthetic field');
});
test('import preserves unrelated cycles and deleting a field cascades only its own cycles', () => {
  const current = fixture(), incoming = emptyData();
  incoming.farms = [{ ...current.farms[0], id: 'other-farm' }]; incoming.fields = [{ ...current.fields[0], id: 'other-field', farm_id: 'other-farm' }]; incoming.cycles = [{ ...current.cycles[0], id: 'other-cycle', field_id: 'other-field' }];
  const result = planImport(current, incoming); assert.equal(result.additions, 3); assert.equal(result.merged.cycles.length, 2);
  const removed = removeField(result.merged, 'field-demo'); assert.deepEqual(removed.cycles.map(c => c.id), ['other-cycle']);
});
test('IndexedDB persists snapshots, rejects stale writers and preserves records on invalid import', async () => {
  globalThis.indexedDB = new IDBFactory();
  const initial = await loadFarm(); assert.equal(initial.revision, 0);
  const saved = await saveFarm(fixture(), initial.revision); assert.equal(saved.revision, 1);
  assert.deepEqual(await loadFarm(), saved);
  await assert.rejects(saveFarm(emptyData(), 0), StorageConflict);
  assert.deepEqual(await loadFarm(), saved);
  const broken = fixture(); broken.cycles[0].field_id = 'missing';
  await assert.rejects(saveFarm(broken, 1)); assert.deepEqual(await loadFarm(), saved);
  const cleared = await saveFarm(emptyData(), 1); assert.equal(cleared.revision, 2); assert.equal((await loadFarm()).fields.length, 0);
});
test('concurrent writes cannot silently overwrite each other', async () => {
  globalThis.indexedDB = new IDBFactory();
  const first = fixture(), second = fixture(); second.fields[0].name = 'Concurrent synthetic edit';
  const attempts = await Promise.allSettled([saveFarm(first, 0), saveFarm(second, 0)]);
  assert.equal(attempts.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(attempts.filter(r => r.status === 'rejected').length, 1);
  assert.equal((await loadFarm()).revision, 1);
});
test('storage is never silently replaced when unavailable', async () => {
  delete globalThis.indexedDB;
  await assert.rejects(loadFarm(), /unavailable/); await assert.rejects(saveFarm(fixture(), 0), /unavailable/);
});
test('a failed IndexedDB write rolls back the transaction and preserves the prior snapshot', async () => {
  globalThis.indexedDB = new IDBFactory();
  const saved = await saveFarm(fixture(), 0);
  const { IDBObjectStore } = await import('fake-indexeddb');
  const original = IDBObjectStore.prototype.put;
  try {
    IDBObjectStore.prototype.put = () => { throw new DOMException('Synthetic quota failure', 'QuotaExceededError'); };
    await assert.rejects(saveFarm(emptyData(), 1), /Synthetic quota failure/);
  } finally { IDBObjectStore.prototype.put = original; }
  assert.deepEqual(await loadFarm(), saved);
});
test('a future database version is rejected without recreating or erasing it', async () => {
  globalThis.indexedDB = new IDBFactory();
  const db = await new Promise((resolve, reject) => {
    const r = indexedDB.open('agrirakshak-farm', 2);
    r.onupgradeneeded = () => r.result.createObjectStore('future-records');
    r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
  });
  db.close();
  await assert.rejects(loadFarm(), /Could not open/);
  const retained = await new Promise((resolve, reject) => { const r = indexedDB.open('agrirakshak-farm'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
  assert.equal(retained.version, 2); assert.ok(retained.objectStoreNames.contains('future-records')); retained.close();
});
test('future sowing dates cannot be imported as currently growing crops', () => {
  const data = fixture(); data.cycles[0].sowing_date = '2099-01-01';
  assert.doesNotThrow(() => validateData(data));
  data.cycles[0].status = 'active'; assert.throws(() => validateData(data), /future sowing/);
  const stage = fixture(); stage.cycles[0].stage = 'vegetative'; stage.cycles[0].stage_recorded_at = '2026-10-05T12:00:00.000Z';
  assert.throws(() => validateData(stage), /planted cycle/);
});
test('local sowing dates stay independent of UTC day boundaries', async () => {
  const { todayInZone } = await import('../lib/domain/farm.ts');
  const clock = new Date('2026-10-05T20:00:00Z');
  assert.equal(todayInZone('Asia/Kolkata', clock), '2026-10-06');
  assert.equal(todayInZone('America/Los_Angeles', clock), '2026-10-05');
});
