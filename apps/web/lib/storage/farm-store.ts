import { emptyData, validateData, type FarmData, type Snapshot } from "../domain/farm.ts";
const DB_NAME = "agrirakshak-farm";
const STORE = "snapshots";
const KEY = "current";
export class StorageConflict extends Error { constructor() { super("Records changed in another tab. Reload before saving or importing; your current saved records were preserved."); } }
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("Device storage is unavailable. Your records cannot be saved in this browser.")); return; }
    let blocked = false;
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { request.result.createObjectStore(STORE); };
    request.onerror = () => reject(new Error("Could not open device storage. Check browser permissions or private browsing settings."));
    request.onblocked = () => { blocked = true; reject(new Error("Close other AgriRakshak tabs before updating device storage.")); };
    request.onsuccess = () => { if (blocked) { request.result.close(); return; } request.result.onversionchange = () => request.result.close(); resolve(request.result); };
  });
}
function snapshot(value: unknown): Snapshot {
  if (value === undefined) return { ...emptyData(), revision: 0 };
  const revision = (value as { revision?: unknown })?.revision;
  if (typeof revision !== "number" || !Number.isSafeInteger(revision) || revision < 0) throw new Error("Saved record revision is invalid. Records have not been overwritten.");
  return { ...validateData(value), revision };
}
export async function loadFarm(): Promise<Snapshot> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly"), request = tx.objectStore(STORE).get(KEY);
    let result: Snapshot;
    request.onsuccess = () => { try { result = snapshot(request.result); } catch (e) { tx.abort(); reject(e); } };
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onabort = tx.onerror = () => { db.close(); reject(new Error("Could not read device records. No records were changed.")); };
  });
}
export async function saveFarm(data: FarmData, expectedRevision: number): Promise<Snapshot> {
  const clean = validateData(data), db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite"), store = tx.objectStore(STORE), request = store.get(KEY);
    let result: Snapshot, failure: unknown;
    request.onsuccess = () => {
      try {
        if (snapshot(request.result).revision !== expectedRevision) throw new StorageConflict();
        result = { ...clean, revision: expectedRevision + 1 };
        store.put(result, KEY);
      } catch (error) { failure = error; tx.abort(); }
    };
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onabort = tx.onerror = () => { db.close(); reject(failure ?? new Error("Could not save records. Storage may be full or blocked; your earlier records remain unchanged.")); };
  });
}
