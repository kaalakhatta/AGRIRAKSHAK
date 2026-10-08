import { emptyData, validateData, type FarmData } from "./farm.ts";
const PREFIX = "exhibition-v1-";
// Fictional local records, not agronomic windows, measurements or model results.
export function exhibitionData(now: string): FarmData {
  const meta = (id: string) => ({ id: PREFIX + id, schema_version: 1 as const, created_at: now, updated_at: now, origin: "demo" as const });
  return validateData({ ...emptyData(),
    farms: [{ ...meta("farm"), name: "Sehore exhibition · synthetic farm", language: "en", timezone: "Asia/Kolkata" }],
    fields: [{ ...meta("field"), farm_id: PREFIX + "farm", name: "Sehore sample plot · demo", region: "Sehore, Madhya Pradesh", area: { value: 1, unit: "ha" }, water: "rainfed", location: null }],
    cycles: [
      { ...meta("soybean"), field_id: PREFIX + "field", crop: "Soybean", variety: null, status: "active", sowing_date: null, stage: null, stage_recorded_at: null, season: "Kharif" },
      { ...meta("wheat"), field_id: PREFIX + "field", crop: "Wheat", variety: null, status: "planned", sowing_date: null, stage: null, stage_recorded_at: null, season: "Rabi" },
      { ...meta("gram"), field_id: PREFIX + "field", crop: "Gram/chickpea", variety: null, status: "planned", sowing_date: null, stage: null, stage_recorded_at: null, season: "Rabi" },
    ],
    tasks: [{ ...meta("reminder"), cycle_id: PREFIX + "soybean", title: "Demo: record my own field observations", schedule: { kind: "date", date: "2026-10-09" }, status: "pending", completed_at: null }],
    expenses: [{ ...meta("cost"), cycle_id: PREFIX + "soybean", date: "2026-10-08", category: "Other", kind: "cost", amount_minor: 180000, currency: "INR", note: "Fictional exhibition cost, not a crop budget recommendation." }],
    harvests: [{ ...meta("harvest"), cycle_id: PREFIX + "soybean", date: "2026-10-08", quantity: 100, unit: "kg", harvested_area: null, note: "Fictional exhibition entry, not measured yield." }],
    sales: [{ ...meta("sale"), cycle_id: PREFIX + "soybean", date: "2026-10-08", quantity: 70, unit: "kg", gross_amount_minor: 280000, currency: "INR", note: "Fictional receipts, not a market price or profit estimate." }],
    observations: [{ ...meta("note"), cycle_id: PREFIX + "soybean", date: "2026-10-08", note: "Synthetic demo note: show how observations stay with a crop cycle. No crop condition has been diagnosed.", tags: ["Other"], scan_summary_id: null }],
  });
}
export function addExhibitionData(current: FarmData, now: string): FarmData {
  const sample = exhibitionData(now);
  const existingFarm = current.farms.find(farm => farm.id === PREFIX + "farm");
  if (existingFarm) {
    if (existingFarm.origin !== "demo") throw new Error("Sample record IDs conflict with existing records. Nothing was replaced.");
    return current;
  }
  const merged = structuredClone(current);
  for (const key of Object.keys(sample).filter(key => key !== "schema_version") as Exclude<keyof FarmData, "schema_version">[]) {
    const existing = new Set(current[key].map(record => record.id));
    if (sample[key].some(record => existing.has(record.id))) throw new Error("Sample record IDs conflict with existing records. Nothing was replaced.");
    (merged[key] as unknown[]) = [...current[key], ...sample[key]];
  }
  return validateData(merged);
}
