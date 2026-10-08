import { STAGES, todayInZone, validateDate, type Snapshot } from "../domain/farm.ts";
import { addDays } from "../domain/calendar.ts";
import { validateCatalog, type Catalog, type Decision, type Rule } from "./engine.ts";
import { farmGuidance, type BoundWeather, type Guidance } from "./farm-guidance.ts";

export type PlanningEvidence = Catalog["evidence"][number] & { claim: string; accessed_on: string; license: string };
export type ComparisonFact = { key: string; label: string; value: string; evidence: string[] };
export type SeedEntry = { rule: Rule; variety_id: string; variety_name: string; facts: ComparisonFact[]; cautions: string[] };
export type CalendarTiming = { kind: "sowing"; start_day: number; end_day: number } | { kind: "stage"; stage: NonNullable<Snapshot["cycles"][number]["stage"]> };
export type CalendarEntry = { rule: Rule; timing: CalendarTiming; cautions: string[] };
export type PlanningCatalog = { schema_version: "planning-1"; version: string; evidence: PlanningEvidence[]; seeds: SeedEntry[]; calendar: CalendarEntry[] };
export const EMPTY_PLANNING_CATALOG: PlanningCatalog = { schema_version: "planning-1", version: "awaiting-reviewed-content", evidence: [], seeds: [], calendar: [] };

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && !!value.trim() && value.length <= 2000;
const keys = (value: Record<string, unknown>, expected: string[]) => Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key));
const texts = (value: unknown): value is string[] => Array.isArray(value) && value.length <= 50 && value.every(text);
const date = (value: unknown): value is string => { try { return typeof value === "string" && validateDate(value) !== null; } catch { return false; } };
const fail = (): never => { throw new Error("Unsupported planning catalog. No seed candidates or crop schedules were evaluated."); };

// Metadata is declarative. Only owner-bundled content is loaded; backups cannot supply it.
export function validatePlanningCatalog(raw: unknown): PlanningCatalog {
  if (!object(raw) || !keys(raw, ["schema_version", "version", "evidence", "seeds", "calendar"]) || raw.schema_version !== "planning-1" || !text(raw.version) || !Array.isArray(raw.evidence) || !Array.isArray(raw.seeds) || !Array.isArray(raw.calendar) || raw.seeds.length + raw.calendar.length > 1000) return fail();
  for (const evidence of raw.evidence) {
    if (!object(evidence) || !keys(evidence, ["id", "url", "verified", "claim", "accessed_on", "license"]) || !text(evidence.claim) || !text(evidence.license) || !date(evidence.accessed_on)) return fail();
    try {
      const url = new URL(String(evidence.url));
      if (url.protocol !== "https:" || url.username || url.password) return fail();
    } catch { return fail(); }
  }
  const varieties = new Set<string>();
  for (const entry of raw.seeds) {
    if (!object(entry) || !keys(entry, ["rule", "variety_id", "variety_name", "facts", "cautions"]) || !object(entry.rule) || !text(entry.variety_id) || varieties.has(entry.variety_id) || !text(entry.variety_name) || !texts(entry.cautions) || !Array.isArray(entry.facts) || !entry.facts.length || entry.facts.length > 50) return fail();
    const factIds = new Set<string>();
    const evidenceIds = entry.rule.evidence;
    for (const fact of entry.facts) {
      if (!object(fact) || !keys(fact, ["key", "label", "value", "evidence"]) || !text(fact.key) || factIds.has(fact.key) || !text(fact.label) || !text(fact.value) || !texts(fact.evidence) || !fact.evidence.length || !Array.isArray(evidenceIds) || !fact.evidence.every(id => evidenceIds.includes(id))) return fail();
      factIds.add(fact.key);
    }
    varieties.add(entry.variety_id);
  }
  for (const entry of raw.calendar) {
    if (!object(entry) || !keys(entry, ["rule", "timing", "cautions"]) || !object(entry.rule) || !object(entry.timing) || !texts(entry.cautions)) return fail();
    const timing = entry.timing;
    if (timing.kind === "sowing") {
      if (!keys(timing, ["kind", "start_day", "end_day"]) || !Number.isSafeInteger(timing.start_day) || !Number.isSafeInteger(timing.end_day) || Math.abs(Number(timing.start_day)) > 3650 || Math.abs(Number(timing.end_day)) > 3650 || Number(timing.start_day) > Number(timing.end_day)) return fail();
    } else if (timing.kind !== "stage" || !keys(timing, ["kind", "stage"]) || !STAGES.includes(timing.stage as typeof STAGES[number])) return fail();
  }
  // Reuse the existing operator, provenance, evidence-reference and duplicate-ID validation.
  const entries = [...raw.seeds, ...raw.calendar] as Record<string, unknown>[];
  validateCatalog({ schema_version: "engine-1", version: raw.version, evidence: raw.evidence, rules: entries.map(entry => entry.rule) });
  for (const entry of entries) {
    const rule = entry.rule as Rule;
    if (!keys(rule, ["id", "version", "title", "action", "review", "evidence", "applicability", "required_inputs", "condition", "contraindications", "conflict_group"]) || !keys(rule.review, ["status", "reviewer", "reviewed_at"])) return fail();
    if (!text(rule.id) || !text(rule.version) || !text(rule.title) || !text(rule.action) || !(rule.review.reviewer === null || text(rule.review.reviewer))) return fail();
    if (rule.review.reviewed_at !== null && new Date(rule.review.reviewed_at).toISOString().slice(0, 19) !== rule.review.reviewed_at.slice(0, 19)) return fail();
    if (!["crop", "region", "season"].every(key => Object.hasOwn(rule.applicability, key))) return fail();
    // Seed selection always needs an explicit water-access check. Soil is rule-specific.
    if (Object.hasOwn(entry, "variety_id") && !rule.required_inputs.some(input => input.input === "water_availability" && input.unit === "text" && input.kinds.length === 1 && input.kinds[0] === "user")) return fail();
    if (Object.hasOwn(entry, "timing") && (entry.timing as CalendarTiming).kind === "stage" && !rule.required_inputs.some(input => input.input === "stage" && input.unit === "text" && input.kinds.length === 1 && input.kinds[0] === "user" && input.max_age_seconds !== null)) return fail();
  }
  return structuredClone(raw) as PlanningCatalog;
}

type Explanation = { reasons: string[]; evidence: string[]; inputs: string[]; reviewer: string; reviewed_at: string };
export type SeedCandidate = Explanation & { id: string; variety_id: string; name: string; facts: { key: string; label: string; value: string; evidence: string[] }[]; cautions: string[] };
export type CalendarProposal = Explanation & { id: string; title: string; action: string; start_date: string | null; end_date: string | null; stage: string | null; timing_label: string; cautions: string[] };
export type PlanningResult = { status: Guidance["status"]; reasons: string[]; decisions: Decision[]; seeds: SeedCandidate[]; calendar: CalendarProposal[]; catalog_version: string | null };

export function planGuidance(snapshot: Snapshot, fieldId: string, cycleId: string | null, now: number, weather: BoundWeather | null = null, raw: unknown = EMPTY_PLANNING_CATALOG): PlanningResult {
  let catalog: PlanningCatalog;
  try { catalog = validatePlanningCatalog(raw); }
  catch { return { status: "unavailable", reasons: ["The planning catalog could not be validated. No seed candidates or crop schedules are available."], decisions: [], seeds: [], calendar: [], catalog_version: null }; }
  const entries = [...catalog.seeds, ...catalog.calendar];
  const engine: Catalog = { schema_version: "engine-1", version: catalog.version, evidence: catalog.evidence, rules: entries.map(entry => entry.rule) };
  const guidance = farmGuidance(snapshot, fieldId, cycleId, now, weather, engine);
  const result: PlanningResult = { status: guidance.status, reasons: [...guidance.reasons], decisions: structuredClone(guidance.decisions), seeds: [], calendar: [], catalog_version: catalog.version };
  if (guidance.status !== "evaluated") return result;
  const field = snapshot.fields.find(field => field.id === fieldId)!;
  const farm = snapshot.farms.find(farm => farm.id === field.farm_id)!;
  const cycle = snapshot.cycles.find(cycle => cycle.id === cycleId && cycle.field_id === fieldId)!;
  if (cycle.status === "harvested" || cycle.status === "archived") {
    return { ...result, status: "needs_input", reasons: ["Choose a planned or active crop cycle for seed comparisons and crop schedules."], decisions: [] };
  }
  const today = todayInZone(farm.timezone, new Date(now));
  const evidenceUrl = (id: string) => catalog.evidence.find(evidence => evidence.id === id)!.url;
  const ready = (rule: Rule): Decision | null => {
    const decision = result.decisions.find(decision => decision.id === rule.id)!;
    if (decision.status !== "matched") return null;
    if (rule.evidence.some(id => catalog.evidence.find(evidence => evidence.id === id)!.accessed_on > new Date(now).toISOString().slice(0, 10))) {
      decision.status = "unreviewed"; decision.reasons = ["Evidence verification dates cannot be in the future."]; return null;
    }
    return decision;
  };
  const explanation = (rule: Rule, decision: Decision): Explanation => ({ reasons: [...decision.reasons], evidence: [...decision.evidence], inputs: [...decision.inputs], reviewer: rule.review.reviewer!, reviewed_at: rule.review.reviewed_at! });
  for (const seed of catalog.seeds) {
    const decision = ready(seed.rule);
    if (!decision) continue;
    result.seeds.push({ ...explanation(seed.rule, decision), id: seed.rule.id, variety_id: seed.variety_id, name: seed.variety_name, facts: seed.facts.map(fact => ({ ...fact, evidence: fact.evidence.map(evidenceUrl) })), cautions: [...seed.cautions] });
  }
  // Stable alphabetical display, never a suitability score or rank.
  result.seeds.sort((a, b) => a.name.localeCompare(b.name, "en") || a.id.localeCompare(b.id, "en"));
  for (const entry of catalog.calendar) {
    const decision = ready(entry.rule);
    if (!decision) continue;
    let start: string | null = null, end: string | null = null, stage: string | null = null, label: string;
    const wait = (reason: string) => { decision.status = "needs_input"; decision.reasons = [reason]; };
    if (entry.timing.kind === "sowing") {
      if (!cycle.sowing_date) { wait("Enter a sowing date to preview this reviewed date window."); continue; }
      try { start = addDays(cycle.sowing_date, entry.timing.start_day); end = addDays(cycle.sowing_date, entry.timing.end_day); }
      catch { decision.status = "blocked"; decision.reasons = ["This reviewed date window is outside the supported calendar range."]; continue; }
      if (today > end) { decision.status = "ineligible"; decision.reasons = ["This reviewed date window has passed. No catch-up action is inferred."]; continue; }
      label = today < start ? "Upcoming reviewed date window" : "Within reviewed date window";
    } else {
      const recorded = Date.parse(cycle.stage_recorded_at ?? "");
      if (!cycle.stage || !Number.isFinite(recorded) || recorded > now) { wait("Confirm the current crop stage and its recording time to preview stage guidance."); continue; }
      if (cycle.stage !== entry.timing.stage) { decision.status = "ineligible"; decision.reasons = ["The confirmed crop stage does not match this reviewed template."]; continue; }
      stage = entry.timing.stage; label = "At your confirmed growth stage";
    }
    result.calendar.push({ ...explanation(entry.rule, decision), id: entry.rule.id, title: entry.rule.title, action: entry.rule.action, start_date: start, end_date: end, stage, timing_label: label, cautions: [...entry.cautions] });
  }
  if (result.seeds.length || result.calendar.length) result.reasons = result.reasons.filter(reason => reason !== "No agricultural action meets the review, coverage and required-input checks for this cycle.");
  if (!result.seeds.length) result.reasons.push("No seed candidate meets the review, coverage and input checks.");
  if (!result.calendar.length) result.reasons.push("No crop schedule meets the review, input and timing checks.");
  return result;
}
