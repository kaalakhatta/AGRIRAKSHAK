import { validateDate, type Meta } from './farm.ts';

export const SOIL_METRICS = {
  ph: { label: 'Soil pH', unit: 'pH', maximum: 14 },
  organic_carbon: { label: 'Organic carbon', unit: 'g_kg', maximum: 1000 },
  sand: { label: 'Sand', unit: 'percent', maximum: 100 },
  clay: { label: 'Clay', unit: 'percent', maximum: 100 },
} as const;
export type SoilMetric = keyof typeof SOIL_METRICS;
export type SoilReading = { metric: SoilMetric; value: number; unit: 'pH' | 'g_kg' | 'percent'; method: string | null };
export type SoilTest = Meta & { field_id: string; sample_date: string; source_kind: 'soil_lab' | 'manual_test'; source: string; depth_cm: { top: number; bottom: number } | null; readings: SoilReading[] };
export function validateSoilTest(value: unknown): SoilTest {
  const fail = (reason: string): never => { throw new Error(`Invalid soil test: ${reason}. No records were changed.`); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('expected a record');
  const s = value as SoilTest;
  const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim() && v.length <= 120;
  const time = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,19) === v.slice(0,19);
  if (s.schema_version !== 1 || !text(s.id) || !text(s.field_id) || !text(s.source) || !['user','demo','import'].includes(s.origin) || !time(s.created_at) || !time(s.updated_at) || Date.parse(s.updated_at) < Date.parse(s.created_at)) return fail('metadata or source is missing');
  if (!['soil_lab','manual_test'].includes(s.source_kind)) return fail('unsupported source kind');
  if (!validateDate(s.sample_date)) return fail('sample date is required');
  let depth_cm: SoilTest['depth_cm'] = null;
  if (s.depth_cm !== null) {
    const d = s.depth_cm;
    if (!d || typeof d !== 'object' || typeof d.top !== 'number' || typeof d.bottom !== 'number' || !Number.isFinite(d.top) || !Number.isFinite(d.bottom) || d.top < 0 || d.bottom <= d.top) return fail('depth must increase from a nonnegative top');
    depth_cm = { top: d.top, bottom: d.bottom };
  }
  if (!Array.isArray(s.readings) || s.readings.length < 1 || s.readings.length > 4) return fail('enter one to four measured properties');
  const seen = new Set<string>();
  const readings = s.readings.map(r => {
    if (!r || typeof r !== 'object' || typeof r.metric !== 'string' || !Object.hasOwn(SOIL_METRICS,r.metric) || seen.has(r.metric)) return fail('unknown or duplicate property');
    const expected = SOIL_METRICS[r.metric];
    if (r.unit !== expected.unit || typeof r.value !== 'number' || !Number.isFinite(r.value) || r.value < 0 || r.value > expected.maximum || !(r.method === null || text(r.method))) return fail('check the value, unit and method');
    seen.add(r.metric);
    return { metric:r.metric, value:r.value, unit:r.unit, method:r.method };
  });
  const sand = readings.find(r=>r.metric === 'sand'), clay = readings.find(r=>r.metric === 'clay');
  if (sand && clay && sand.value + clay.value > 100) return fail('sand and clay percentages exceed 100 together');
  return {id:s.id,schema_version:1,created_at:s.created_at,updated_at:s.updated_at,origin:s.origin,field_id:s.field_id,sample_date:s.sample_date,source_kind:s.source_kind,source:s.source,depth_cm,readings};
}
