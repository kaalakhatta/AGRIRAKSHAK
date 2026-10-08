import type { Snapshot } from "../domain/farm.ts";
import { weatherFresh, type Weather } from "../providers/weather.ts";
import { EMPTY_CATALOG, evaluateCatalog, validateCatalog, type Decision, type Input } from "./engine.ts";

export const INITIAL_COVERAGE = {
  region: "IN-MP-SEHORE", label: "Sehore, Madhya Pradesh",
  crops: ["soybean", "wheat", "chickpea"],
} as const;
export type TargetCrop = typeof INITIAL_COVERAGE.crops[number];
const normalize = (value: string | null | undefined) => value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
export function targetCrop(value: string | null | undefined): TargetCrop | null {
  const aliases: Record<string, TargetCrop> = { soybean: "soybean", soyabean: "soybean", wheat: "wheat", gram: "chickpea", chickpea: "chickpea", "gram/chickpea": "chickpea", chana: "chickpea" };
  const key = normalize(value);
  return Object.hasOwn(aliases, key) ? aliases[key] : null;
}
export function targetRegion(value: string | null | undefined): boolean {
  return ["in-mp-sehore", "sehore", "sehore, madhya pradesh", "madhya pradesh, sehore", "sehore, mp"].includes(normalize(value));
}
export type Guidance = {
  status: "needs_input" | "outside_focus" | "demo" | "awaiting_review" | "evaluated" | "unavailable";
  reasons: string[];
  decisions: Decision[];
  actions: { id: string; title: string; action: string; reasons: string[]; evidence: string[]; reviewer: string; reviewed_at: string }[];
};
export type BoundWeather = { field_id: string; weather: Weather };

// Pure, field-bound adapter. Coverage describes the project focus, not expert approval.
// Imported records pass the normal record validator; caller must supply that snapshot.
export function farmGuidance(snapshot: Snapshot, fieldId: string, cycleId: string | null, now: number, boundWeather: BoundWeather | null = null, rawCatalog: unknown = EMPTY_CATALOG): Guidance {
  const result = (status: Guidance["status"], ...reasons: string[]): Guidance => ({ status, reasons, decisions: [], actions: [] });
  if (!Number.isFinite(now) || now <= 0) return result("unavailable", "Guidance is waiting for the current time.");
  const field = snapshot.fields.find(f => f.id === fieldId);
  const farm = snapshot.farms.find(f => f.id === field?.farm_id);
  if (!field || !farm) return result("needs_input", "Choose a saved field.");
  const cycle = snapshot.cycles.find(c => c.id === cycleId && c.field_id === fieldId);
  if (!cycle) return result("needs_input", "Choose a crop cycle belonging to this field.");
  if ([farm, field, cycle].some(record => record.origin === "demo")) return result("demo", "Synthetic demo records cannot support agricultural guidance.");
  if (!field.region?.trim()) return result("needs_input", "Enter the field’s district in My Farm. Initial focus: Sehore, Madhya Pradesh.");
  if (["mp", "madhya pradesh", "in-mp"].includes(normalize(field.region))) return result("needs_input", "Confirm the district as well as Madhya Pradesh in My Farm.");
  const crop = targetCrop(cycle.crop);
  if (!targetRegion(field.region) || !crop) return result("outside_focus", "This field and crop are not confirmed within the initial focus: Sehore, Madhya Pradesh; soybean, wheat and gram/chickpea. Records and personal reminders remain available.");
  const inputs: Record<string, Input> = {};
  const user = (value: string | null, observed_at: string): Input => ({ field_id: fieldId, value, unit: "text", kind: "user", observed_at, synthetic: false });
  inputs.region = user(INITIAL_COVERAGE.region, field.updated_at);
  inputs.crop = user(crop, cycle.updated_at);
  inputs.season = user(normalize(cycle.season) || null, cycle.updated_at);
  inputs.variety = user(cycle.variety, cycle.updated_at);
  inputs.water_availability = user(field.water === "unknown" ? null : field.water, field.updated_at);
  // An unrelated edit cannot refresh the time of a farmer-confirmed crop stage.
  inputs.stage = { ...user(cycle.stage, cycle.updated_at), observed_at: cycle.stage_recorded_at };
  const reasons: string[] = [];
  if (!inputs.season.value) reasons.push("Record the intended season in My Farm; it is not inferred from the crop or date.");
  if (!inputs.water_availability.value) reasons.push("Record water access for guidance that requires it.");
  if (boundWeather?.field_id === fieldId && weatherFresh(boundWeather.weather, now)) {
    const w = boundWeather.weather;
    const measured = (value: number | null, unit: Input["unit"]): Input => ({ field_id: fieldId, value, unit, kind: "weather_estimate", observed_at: w.observed_at, synthetic: false });
    inputs.air_temperature = measured(w.current.temperature, "degC");
    inputs.relative_humidity = measured(w.current.humidity, "percent");
    inputs.precipitation = { ...measured(w.current.precipitation, "mm"), interval_seconds: w.interval_seconds };
    inputs.wind_speed = measured(w.current.wind, "m_s");
  } else reasons.push("Fresh estimates for this field are unavailable; weather-dependent guidance must wait.");
  // Dates in the soil notebook do not establish an observation timestamp/method contract.
  // Forecast issuance is unknown. Neither is silently converted into eligible inputs.
  reasons.push("Soil-based guidance awaits reviewed measurement requirements. Screening coverage is separate from planning coverage.");
  let catalog;
  try { catalog = validateCatalog(rawCatalog); }
  catch { return result("unavailable", "The guidance catalog could not be validated. No agricultural actions are available."); }
  if (!catalog.rules.length) return { ...result("awaiting_review", "No reviewed agricultural guidance is available yet. The agronomy reviewer is still to be confirmed."), reasons: [...reasons, "No reviewed agricultural guidance is available yet. The agronomy reviewer is still to be confirmed."] };
  const decisions = evaluateCatalog(catalog, fieldId, inputs, now).map(decision => {
    const rule = catalog.rules.find(r => r.id === decision.id)!;
    if (decision.status === "matched" && !["crop", "region", "season"].every(key => Object.hasOwn(rule.applicability, key))) {
      return { ...decision, status: "blocked" as const, reasons: ["Reviewed crop, region and season applicability are required."] };
    }
    return decision;
  });
  const actions = decisions.filter(d => d.status === "matched").map(d => {
    const rule = catalog.rules.find(r => r.id === d.id)!;
    return { id: d.id, title: rule.title, action: rule.action, reasons: d.reasons, evidence: d.evidence, reviewer: rule.review.reviewer!, reviewed_at: rule.review.reviewed_at! };
  });
  if (!actions.length) reasons.push("No agricultural action meets the review, coverage and required-input checks for this cycle.");
  return { status: "evaluated", reasons, decisions, actions };
}
