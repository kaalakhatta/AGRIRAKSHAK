import { validateSoilTest, type SoilTest } from "./soil.ts";
import { validateScan, type ScanSummary } from "./scans.ts";
import { validateTask, type CalendarTask } from "./calendar.ts";
export const WATER_OPTIONS = ["unknown", "rainfed", "irrigated", "supplemental"] as const;
export const CYCLE_STATUSES = ["planned", "active", "harvested", "archived"] as const;
export const STAGES = ["establishment", "vegetative", "flowering", "fruiting", "maturity"] as const;
export type Meta = { id: string; schema_version: 1; created_at: string; updated_at: string; origin: "user" | "demo" | "import" };
export type Coordinates = { latitude: number; longitude: number; accuracy_m: number | null; method: "gps" | "manual"; confirmed_at: string };
export type Farm = Meta & { name: string; language: "en"; timezone: string };
export type Field = Meta & { farm_id: string; name: string; region: string | null; area: { value: number; unit: "ha" | "acre" | "m2" } | null; water: typeof WATER_OPTIONS[number]; location: Coordinates | null };
export type CropCycle = Meta & { field_id: string; crop: string; variety: string | null; status: typeof CYCLE_STATUSES[number]; sowing_date: string | null; stage: typeof STAGES[number] | null; stage_recorded_at: string | null; season: string | null };
export type FarmData = { schema_version: 4; farms: Farm[]; fields: Field[]; cycles: CropCycle[]; tasks: CalendarTask[]; scans: ScanSummary[]; soil_tests: SoilTest[] };
export type Snapshot = FarmData & { revision: number };
export type Backup = { schema_version: 4; application_version: "farm-m4-v4"; exported_at: string; includes_coordinates: boolean; data: FarmData };
export type ImportPlan = { merged: FarmData; conflicts: { id: string; label: string }[]; additions: number };
export const emptyData = (): FarmData => ({ schema_version: 4, farms: [], fields: [], cycles: [], tasks: [], scans: [], soil_tests: [] });
export const newMeta = (now = new Date().toISOString()): Meta => ({ id: crypto.randomUUID(), schema_version: 1, created_at: now, updated_at: now, origin: "user" });

function fail(message: string): never { throw new Error(message); }
function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object.`);
  return value as Record<string, unknown>;
}
function text(value: unknown, label: string, max = 120): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) fail(`${label} must contain 1–${max} characters.`);
  return value;
}
function optionalText(value: unknown, label: string): string | null { return value === null ? null : text(value, label); }
function number(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) fail(`${label} is outside its valid range.`);
  return value;
}
function timestamp(value: unknown, label: string): string {
  const s = text(value, label, 30);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(s) || !Number.isFinite(Date.parse(s)) || new Date(s).toISOString().slice(0,19) !== s.slice(0,19)) fail(`${label} must be a valid UTC timestamp.`);
  return s;
}
function choice<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (!values.includes(value as T)) fail(`${label} is unsupported.`);
  return value as T;
}
function meta(v: Record<string, unknown>): Meta {
  if (v.schema_version !== 1) fail("Unsupported record version.");
  const created_at = timestamp(v.created_at, "Creation time"), updated_at = timestamp(v.updated_at, "Update time");
  if (Date.parse(updated_at) < Date.parse(created_at)) fail("Update time precedes creation.");
  return { id: text(v.id, "Record ID"), schema_version: 1, created_at, updated_at, origin: choice(v.origin, ["user", "demo", "import"], "Record origin") };
}
export function validateCoordinates(value: unknown): Coordinates {
  const v = object(value, "Location");
  return { latitude: number(v.latitude, "Latitude", -90, 90), longitude: number(v.longitude, "Longitude", -180, 180), accuracy_m: v.accuracy_m === null ? null : number(v.accuracy_m, "Location accuracy", 0, Number.MAX_VALUE), method: choice(v.method, ["gps", "manual"], "Location method"), confirmed_at: timestamp(v.confirmed_at, "Location confirmation") };
}
export function validateDate(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value) fail("Date must be a real YYYY-MM-DD date.");
  return value;
}
export function todayInZone(timezone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function validateData(value: unknown): FarmData {
  const v = object(value, "Farm records");
  if (v.schema_version !== 1 && v.schema_version !== 2 && v.schema_version !== 3 && v.schema_version !== 4) fail("This record version is not supported. Your saved data has not been changed.");
  for (const key of ["farms", "fields", "cycles"]) if (!Array.isArray(v[key]) || (v[key] as unknown[]).length > 1000) fail(`${key} must be an array with no more than 1,000 records.`);
  if (v.schema_version === 1 && v.tasks !== undefined) fail("Version 1 records cannot contain calendar reminders.");
  if (v.schema_version !== 1 && (!Array.isArray(v.tasks) || v.tasks.length > 1000)) fail("Calendar must contain no more than 1,000 reminders.");
  const tasks = v.schema_version === 1 ? [] : (v.tasks as unknown[]).map(validateTask);
  if (Number(v.schema_version) < 3 && v.scans !== undefined) fail("Earlier record versions cannot contain scan summaries.");
  if (Number(v.schema_version) >= 3 && (!Array.isArray(v.scans) || v.scans.length > 1000)) fail("Timeline must contain no more than 1,000 summaries.");
  const scans = Number(v.schema_version) >= 3 ? (v.scans as unknown[]).map(validateScan) : [];
  if (v.schema_version !== 4 && v.soil_tests !== undefined) fail("Earlier versions cannot contain soil tests.");
  if (v.schema_version === 4 && (!Array.isArray(v.soil_tests) || v.soil_tests.length > 1000)) fail("Soil notebook must contain no more than 1,000 tests.");
  const soil_tests = v.schema_version === 4 ? (v.soil_tests as unknown[]).map(validateSoilTest) : [];
  const farms = (v.farms as unknown[]).map(item => {
    const f = object(item, "Farm");
    const timezone = text(f.timezone, "Timezone");
    try { new Intl.DateTimeFormat("en", { timeZone: timezone }); } catch { fail("Timezone is invalid."); }
    return { ...meta(f), name: text(f.name, "Farm name"), language: choice(f.language, ["en"], "Language"), timezone };
  });
  const fields = (v.fields as unknown[]).map(item => {
    const f = object(item, "Field"), a = f.area === null ? null : object(f.area, "Area");
    const area = a ? { value: number(a.value, "Area", Number.MIN_VALUE, Number.MAX_VALUE), unit: choice(a.unit, ["ha", "acre", "m2"], "Area unit") } : null;
    return { ...meta(f), farm_id: text(f.farm_id, "Farm reference"), name: text(f.name, "Field name"), region: optionalText(f.region, "Region"), area, water: choice(f.water, WATER_OPTIONS, "Water access"), location: f.location === null ? null : validateCoordinates(f.location) };
  });
  const cycles = (v.cycles as unknown[]).map(item => {
    const c = object(item, "Crop cycle");
    const stage = c.stage === null ? null : choice(c.stage, STAGES, "Crop stage");
    const stage_recorded_at = c.stage_recorded_at === null ? null : timestamp(c.stage_recorded_at, "Stage time");
    if ((stage === null) !== (stage_recorded_at === null)) fail("A confirmed crop stage requires a recording time.");
    return { ...meta(c), field_id: text(c.field_id, "Field reference"), crop: text(c.crop, "Crop"), variety: optionalText(c.variety, "Variety"), status: choice(c.status, CYCLE_STATUSES, "Cycle status"), sowing_date: validateDate(c.sowing_date), stage, stage_recorded_at, season: optionalText(c.season, "Season") };
  });
  const ids = new Set<string>();
  for (const record of [...farms, ...fields, ...cycles, ...tasks, ...scans, ...soil_tests]) { if (ids.has(record.id)) fail("Duplicate record IDs in this file."); ids.add(record.id); }
  const farmIds = new Set(farms.map(f => f.id)), fieldIds = new Set(fields.map(f => f.id));
  if (fields.some(f => !farmIds.has(f.farm_id)) || cycles.some(c => !fieldIds.has(c.field_id))) fail("A record references a missing farm or field.");
  if (tasks.some(t => !cycles.some(c => c.id === t.cycle_id))) fail("A reminder references a missing crop cycle.");
  if (scans.some(s => s.cycle_id !== null && !cycles.some(c => c.id === s.cycle_id))) fail("A screening summary references a missing crop cycle.");
  for (const soil of soil_tests) {
    const field = fields.find(f => f.id === soil.field_id);
    if (!field) fail("A soil test references a missing field.");
    const farm = farms.find(f => f.id === field.farm_id)!;
    if (soil.sample_date > todayInZone(farm.timezone) || soil.sample_date > todayInZone(farm.timezone,new Date(soil.created_at))) fail("Soil sample date cannot be in the future or after the record was created.");
  }
  for (const cycle of cycles) {
    const field = fields.find(f => f.id === cycle.field_id)!;
    const farm = farms.find(f => f.id === field.farm_id)!;
    if (cycle.sowing_date && cycle.sowing_date > todayInZone(farm.timezone) && (cycle.status !== "planned" || cycle.stage !== null)) fail("A future sowing date requires a planned cycle without a current stage.");
    if (cycle.status === "planned" && cycle.stage !== null) fail("A current growth stage requires a planted cycle. Choose Active or clear the stage.");
  }
  return { schema_version: 4, farms, fields, cycles, tasks, scans, soil_tests };
}
export function makeBackup(data: FarmData, includeCoordinates = false, now = new Date().toISOString()): Backup {
  const clean = validateData(data);
  return { schema_version: 4, application_version: "farm-m4-v4", exported_at: now, includes_coordinates: includeCoordinates, data: { ...clean, fields: clean.fields.map(f => ({ ...f, location: includeCoordinates ? f.location : null })) } };
}
export function parseBackup(raw: string): Backup {
  if (new TextEncoder().encode(raw).length > 2 * 1024 * 1024) fail("Backup must be smaller than 2 MB.");
  let decoded: unknown;
  try { decoded = JSON.parse(raw); } catch { fail("This file is not valid JSON. No records were changed."); }
  const v = object(decoded, "Backup");
  if (!((v.schema_version === 1 && v.application_version === "farm-m1-v1") || (v.schema_version === 2 && v.application_version === "farm-m3-v2") || (v.schema_version === 3 && v.application_version === "farm-m3-v3") || (v.schema_version === 4 && v.application_version === "farm-m4-v4"))) fail("Unsupported backup version. No records were changed.");
  if (typeof v.includes_coordinates !== "boolean") fail("Backup privacy flags are missing.");
  if (!v.data || typeof v.data !== "object" || (v.data as { schema_version?: unknown }).schema_version !== v.schema_version) fail("Backup and record versions disagree.");
  const data = validateData(v.data);
  if (!v.includes_coordinates && data.fields.some(f => f.location !== null)) fail("Backup contains coordinates without declaring them.");
  return { schema_version: 4, application_version: "farm-m4-v4", exported_at: timestamp(v.exported_at, "Export time"), includes_coordinates: v.includes_coordinates, data };
}
export function planImport(current: FarmData, incoming: FarmData, conflictChoice?: "device" | "backup"): ImportPlan {
  current = validateData(current); incoming = validateData(incoming);
  const conflicts: ImportPlan["conflicts"] = [];
  let additions = 0;
  const merge = <T extends Meta>(a: T[], b: T[]): T[] => {
    const records = new Map(a.map(r => [r.id, r]));
    for (const r of b) {
      const existing = records.get(r.id);
      if (!existing) { records.set(r.id, r); additions++; }
      else if (JSON.stringify(existing) !== JSON.stringify(r)) { conflicts.push({ id: r.id, label: "name" in r ? String(r.name) : "crop" in r ? String(r.crop) : r.id }); if (conflictChoice === "backup") records.set(r.id, r); }
    }
    return [...records.values()];
  };
  const merged = validateData({ schema_version: 4, soil_tests: merge(current.soil_tests,incoming.soil_tests), scans: merge(current.scans,incoming.scans), tasks: merge(current.tasks,incoming.tasks), farms: merge(current.farms, incoming.farms), fields: merge(current.fields, incoming.fields), cycles: merge(current.cycles, incoming.cycles) });
  return { merged, conflicts, additions };
}
export function removeCycle(data: FarmData, id: string): FarmData {
  return { ...data, cycles: data.cycles.filter(c => c.id !== id), tasks: data.tasks.filter(t => t.cycle_id !== id), scans: data.scans.filter(s => s.cycle_id !== id) };
}
export function removeField(data: FarmData, id: string): FarmData {
  const cycleIds = new Set(data.cycles.filter(c => c.field_id === id).map(c => c.id));
  return { ...data, fields: data.fields.filter(f => f.id !== id), soil_tests: data.soil_tests.filter(s => s.field_id !== id), cycles: data.cycles.filter(c => !cycleIds.has(c.id)), tasks: data.tasks.filter(t => !cycleIds.has(t.cycle_id)), scans: data.scans.filter(s => s.cycle_id === null || !cycleIds.has(s.cycle_id)) };
}
