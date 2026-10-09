import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { locateDevice } from '../lib/providers/device-location.ts';
import { createFieldSetup } from '../lib/domain/field-setup.ts';
import { makeBackup } from '../lib/domain/farm.ts';
import { loadFarm, saveFarm } from '../lib/storage/farm-store.ts';

const position = { coords: { latitude: 23, longitude: 77, accuracy: 12, altitude: 250, altitudeAccuracy: 50, heading: 90, speed: 1 }, timestamp: 0 };
const signal = () => new AbortController().signal;
test('explicit one-shot device request returns only validated point/accuracy with bounded acquisition options', async () => {
  let calls = 0;
  const device = { getCurrentPosition(success, failure, options) { calls++; assert.deepEqual(options, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }); success(position); }, watchPosition() { throw Error('No tracking'); } };
  assert.deepEqual(await locateDevice(device, signal()), { latitude: 23, longitude: 77, accuracy_m: 12, method: 'gps' });
  assert.equal(calls, 1); assert.equal(position.coords.altitude, 250);
});
test('permission denial, timeout and unavailable positions give safe actionable fallbacks without leaking raw error data', async () => {
  for (const [code, expected] of [[1, /denied.*manually/], [2, /location services.*manually/], [3, /timed out.*manually/], [99, /location services/]]) {
    await assert.rejects(locateDevice({ getCurrentPosition(success, failure) { failure({ code, message: 'Sensitive raw device details' }); } }, signal()), failure => expected.test(failure.message) && !failure.message.includes('Sensitive'));
  }
  await assert.rejects(locateDevice(null, signal()), /unavailable.*skip/);
  await assert.rejects(locateDevice({ getCurrentPosition() { throw Error('Sensitive raw device details'); } }, signal()), failure => /could not start/.test(failure.message) && !failure.message.includes('Sensitive'));
});
test('invalid device coordinates or accuracy cannot become a field pin, while exact zero accuracy remains explicit', async () => {
  for (const patch of [{ latitude: NaN }, { latitude: 91 }, { longitude: -181 }, { longitude: Infinity }, { accuracy: -1 }, { accuracy: NaN }]) {
    await assert.rejects(locateDevice({ getCurrentPosition(success) { success({ ...position, coords: { ...position.coords, ...patch } }); } }, signal()), /invalid location/);
  }
  const value = await locateDevice({ getCurrentPosition(success) { success({ ...position, coords: { ...position.coords, accuracy: 0 } }); } }, signal());
  assert.equal(value.accuracy_m, 0);
});
test('cancellation before requesting avoids prompting; cancellation in flight discards delayed success and failure', async () => {
  const already = new AbortController(); already.abort(); let calls = 0;
  await assert.rejects(locateDevice({ getCurrentPosition() { calls++; } }, already.signal), { name: 'AbortError' }); assert.equal(calls, 0);
  const pending = new AbortController(); let success, failure;
  const result = locateDevice({ getCurrentPosition(ok, fail) { success = ok; failure = fail; } }, pending.signal);
  pending.abort(); await assert.rejects(result, { name: 'AbortError' });
  success(position); failure({ code: 1 }); // no late callback can resolve a cancelled promise
});
test('retained device location survives local save/reload with method and accuracy; backups omit it by default and removal persists', async () => {
  globalThis.indexedDB = new IDBFactory();
  const current = await loadFarm(), now = new Date().toISOString();
  const point = await locateDevice({ getCurrentPosition(success) { success(position); } }, signal());
  const coordinates = { ...point, confirmed_at: now };
  const input = { name: 'Synthetic GPS fixture', district: 'Sehore', coordinates, remember: true, crop: 'soybean', season: 'Kharif', water: 'rainfed' };
  const retained = createFieldSetup(current, input, now);
  await saveFarm(retained.data, current.revision);
  const reloaded = await loadFarm();
  assert.deepEqual(reloaded.fields[0].location, coordinates);
  assert.equal(makeBackup(reloaded).data.fields[0].location, null);
  assert.deepEqual(makeBackup(reloaded, true).data.fields[0].location, coordinates);
  const temporary = createFieldSetup(reloaded, { ...input, remember: false, name: 'Synthetic temporary fixture' }, now);
  assert.equal(temporary.field.location, null);
  await saveFarm({ ...reloaded, fields: reloaded.fields.map(field => ({ ...field, location: null, updated_at: now })) }, reloaded.revision);
  assert.equal((await loadFarm()).fields[0].location, null);
});
