// Owner evaluator contract engine-1. Catalog-author integration is pending review.
export const UNITS = ["text", "degC", "percent", "mm", "m_s", "pH", "g_kg", "m3_m3"] as const;
export const KINDS = ["user", "weather_estimate", "forecast", "soil_map", "soil_lab", "sensor"] as const;
type Unit = typeof UNITS[number];
type Kind = typeof KINDS[number];
export type Input = { field_id: string; value: string | number | null; unit: Unit; kind: Kind; observed_at: string | null; synthetic: boolean; depth_cm?: { top: number; bottom: number }; interval_seconds?: number };
export type Condition = { op: "all" | "any"; conditions: Condition[] } | { op: "exists"; input: string } | { op: "eq" | "lt" | "lte" | "gt" | "gte"; input: string; value: string | number } | { op: "in"; input: string; values: (string | number)[] };
export type Requirement = { input: string; unit: Unit; kinds: Kind[]; max_age_seconds: number | null; depth_cm?: { top: number; bottom: number }; interval_seconds?: number };
export type Rule = { id: string; version: string; title: string; action: string; review: { status: "draft" | "reviewed" | "rejected"; reviewer: string | null; reviewed_at: string | null }; evidence: string[]; applicability: Record<string, string[]>; required_inputs: Requirement[]; condition: Condition; contraindications: Condition[]; conflict_group: string | null };
export type Catalog = { schema_version: "engine-1"; version: string; evidence: { id: string; url: string; verified: boolean }[]; rules: Rule[] };
export type Decision = { id: string; status: "matched" | "ineligible" | "needs_input" | "stale" | "blocked" | "unreviewed"; reasons: string[]; evidence: string[]; inputs: string[] };
const fail = () => { throw new Error("Unsupported recommendation catalog. No advice was evaluated."); };
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 2000;
const scalar = (v: unknown) => text(v) || typeof v === "number" && Number.isFinite(v);
const timestamp = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v) && v.endsWith("Z") && Number.isFinite(Date.parse(v));
function condition(v: unknown, depth = 0): v is Condition {
  if (!record(v) || depth > 12) return false;
  if (v.op === "all" || v.op === "any") return Array.isArray(v.conditions) && v.conditions.length > 0 && v.conditions.length <= 50 && v.conditions.every(c => condition(c,depth+1));
  if (!text(v.input)) return false;
  if (v.op === "exists") return true;
  if (v.op === "in") return Array.isArray(v.values) && v.values.length > 0 && v.values.length <= 50 && v.values.every(scalar);
  return ["eq","lt","lte","gt","gte"].includes(String(v.op)) && scalar(v.value) && (v.op === "eq" || typeof v.value === "number");
}
function references(c: Condition): string[] { return "conditions" in c ? c.conditions.flatMap(references) : [c.input]; }
export function validateCatalog(value: unknown): Catalog {
  if (!record(value) || value.schema_version !== "engine-1" || !text(value.version) || !Array.isArray(value.evidence) || !Array.isArray(value.rules) || value.rules.length > 1000 || value.evidence.length > 1000) return fail();
  const evidence = new Set<string>(), ids = new Set<string>();
  for (const e of value.evidence) {
    if (!record(e) || !text(e.id) || evidence.has(e.id) || typeof e.url !== "string" || !/^https:\/\//.test(e.url) || typeof e.verified !== "boolean") return fail();
    try { new URL(e.url); } catch { return fail(); } evidence.add(e.id);
  }
  for (const r of value.rules) {
    if (!record(r) || !text(r.id) || ids.has(r.id) || !text(r.version) || !text(r.title) || !text(r.action) || !record(r.review) || !["draft","reviewed","rejected"].includes(String(r.review.status)) || !(r.review.reviewer === null || text(r.review.reviewer)) || !(r.review.reviewed_at === null || timestamp(r.review.reviewed_at)) || !Array.isArray(r.evidence) || !r.evidence.every(e => text(e) && evidence.has(e)) || !record(r.applicability) || !Object.values(r.applicability).every(v => Array.isArray(v) && v.length > 0 && v.every(text)) || !Array.isArray(r.required_inputs) || !condition(r.condition) || !Array.isArray(r.contraindications) || !r.contraindications.every(c => condition(c)) || !(r.conflict_group === null || text(r.conflict_group))) return fail();
    const required = new Set<string>();
    for (const q of r.required_inputs) {
      if (!record(q) || !text(q.input) || required.has(q.input) || !UNITS.includes(q.unit as Unit) || !Array.isArray(q.kinds) || !q.kinds.length || !q.kinds.every(k => KINDS.includes(k)) || !(q.max_age_seconds === null || typeof q.max_age_seconds === "number" && Number.isFinite(q.max_age_seconds) && q.max_age_seconds > 0)) return fail();
      if (q.depth_cm !== undefined && (!record(q.depth_cm) || typeof q.depth_cm.top !== "number" || typeof q.depth_cm.bottom !== "number" || !Number.isFinite(q.depth_cm.top) || !Number.isFinite(q.depth_cm.bottom) || q.depth_cm.top < 0 || q.depth_cm.bottom <= q.depth_cm.top)) return fail();
      if (q.interval_seconds !== undefined && (typeof q.interval_seconds !== "number" || !Number.isFinite(q.interval_seconds) || q.interval_seconds <= 0)) return fail();
      if (q.input === "precipitation" && q.interval_seconds === undefined) return fail();
      required.add(q.input);
    }
    if (![...references(r.condition as Condition), ...r.contraindications.flatMap(c => references(c as Condition)), ...Object.keys(r.applicability)].every(id => required.has(id))) return fail();
    ids.add(r.id);
  }
  return structuredClone(value) as Catalog;
}
function evaluateCondition(c: Condition, inputs: Record<string, Input>): boolean | null {
  if ("conditions" in c) {
    const values = c.conditions.map(x => evaluateCondition(x,inputs));
    return c.op === "all" ? values.includes(false) ? false : values.includes(null) ? null : true : values.includes(true) ? true : values.includes(null) ? null : false;
  }
  const v = inputs[c.input]?.value;
  if (v === null || v === undefined) return null;
  if (c.op === "exists") return true;
  if (c.op === "in") return c.values.includes(v);
  if (c.op === "eq") return v === c.value;
  if (typeof v !== "number" || typeof c.value !== "number") return null;
  return c.op === "lt" ? v < c.value : c.op === "lte" ? v <= c.value : c.op === "gt" ? v > c.value : v >= c.value;
}
export const EMPTY_CATALOG: Catalog = { schema_version: "engine-1", version: "awaiting-reviewed-content", evidence: [], rules: [] };
export function evaluateCatalog(raw: unknown, fieldId: string, inputs: Record<string, Input>, now: number): Decision[] {
  if (!Number.isFinite(now)) throw new Error("A valid evaluation clock is required.");
  const catalog = validateCatalog(raw);
  const results = catalog.rules.map(rule => {
    const result: Decision = { id: rule.id, status: "matched", reasons: [], evidence: rule.evidence.map(id => catalog.evidence.find(e => e.id === id)!.url), inputs: rule.required_inputs.map(q => q.input) };
    const finish = (status: Decision["status"], reason: string) => ({ ...result, status, reasons: [reason] });
    if (rule.review.status !== "reviewed" || !rule.review.reviewer || !rule.review.reviewed_at || Date.parse(rule.review.reviewed_at) > now || !rule.evidence.length || rule.evidence.some(id => !catalog.evidence.find(e => e.id === id)!.verified)) return finish("unreviewed","Verified evidence and a completed human review are required.");
    // Input scope and provenance apply to applicability too; never select using another field.
    for (const [id, allowed] of Object.entries(rule.applicability)) {
      const i = inputs[id];
      if (!i || i.value === null) return finish("needs_input",`Enter ${id} to check coverage.`);
      if (i.field_id !== fieldId || i.synthetic !== false) return finish("blocked",`${id} is synthetic or belongs to another field.`);
      if (!allowed.includes(String(i.value))) return finish("ineligible",`Reviewed coverage does not include this ${id}.`);
    }
    for (const q of rule.required_inputs) {
      const i = inputs[q.input];
      if (!i || i.value === null || i.value === undefined) return finish("needs_input",`Missing required input: ${q.input}.`);
      if (i.field_id !== fieldId || i.synthetic !== false || !q.kinds.includes(i.kind) || i.unit !== q.unit || (typeof i.value !== "string" && (typeof i.value !== "number" || !Number.isFinite(i.value))) || (q.unit === "text" ? typeof i.value !== "string" : typeof i.value !== "number") || q.depth_cm && (q.depth_cm.top !== i.depth_cm?.top || q.depth_cm.bottom !== i.depth_cm?.bottom) || q.interval_seconds !== undefined && q.interval_seconds !== i.interval_seconds) return finish("blocked",`Unsupported scope, provenance, unit, depth or interval: ${q.input}.`);
      const time = timestamp(i.observed_at) ? Date.parse(i.observed_at!) : NaN;
      if (!Number.isFinite(time) || time > now) return finish("needs_input",`A valid observation time is required for ${q.input}.`);
      if (q.max_age_seconds !== null && now - time >= q.max_age_seconds * 1000) return finish("stale",`Required input is stale: ${q.input}.`);
    }
    const prohibited = rule.contraindications.map(c => evaluateCondition(c,inputs));
    if (prohibited.includes(true)) return finish("blocked","A reviewed contraindication applies.");
    if (prohibited.includes(null)) return finish("needs_input","A contraindication cannot be checked.");
    const matches = evaluateCondition(rule.condition,inputs);
    return matches === null ? finish("needs_input","Required evidence is incomplete.") : matches ? finish("matched","Reviewed coverage and required evidence match; check locally with an agricultural expert.") : finish("ineligible","The reviewed conditions do not match.");
  });
  const groups = new Map<string, Decision[]>();
  for (const r of results) {
    const group = catalog.rules.find(rule => rule.id === r.id)!.conflict_group;
    if (r.status === "matched" && group) groups.set(group,[...(groups.get(group) ?? []),r]);
  }
  for (const group of groups.values()) if (group.length > 1) for (const r of group) { r.status = "blocked"; r.reasons = ["Conflicting actions need expert review; no reviewed precedence is available."]; }
  return results;
}
