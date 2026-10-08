import type { Meta } from "./farm.ts";
import type { ScreeningResult } from "../inference/types.ts";
export type ScanSummary = Meta & { cycle_id: string | null; screened_at: string; model_version: string; availability: "simulation" | "unavailable"; demo_label: string | null; predicted_class: null; confidence: null };
export function validateScan(value: unknown): ScanSummary {
  const fail = (): never => { throw new Error("Invalid screening summary. No records were changed."); };
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail();
  const s = value as ScanSummary;
  const text = (v: unknown): v is string => typeof v === "string" && !!v.trim() && v.length <= 120;
  const time = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,19) === v.slice(0,19);
  if (s.schema_version !== 1 || !text(s.id) || !(s.cycle_id === null || text(s.cycle_id)) || !time(s.created_at) || !time(s.updated_at) || !time(s.screened_at) || Date.parse(s.updated_at) < Date.parse(s.created_at) || Date.parse(s.screened_at) > Date.parse(s.created_at) || !text(s.model_version) || s.predicted_class !== null || s.confidence !== null) return fail();
  if (s.availability === "simulation" ? s.origin !== "demo" || !text(s.demo_label) : s.availability !== "unavailable" || !["user","demo","import"].includes(s.origin) || s.demo_label !== null) return fail();
  return { id:s.id,schema_version:1,created_at:s.created_at,updated_at:s.updated_at,origin:s.origin,cycle_id:s.cycle_id,screened_at:s.screened_at,model_version:s.model_version,availability:s.availability,demo_label:s.demo_label,predicted_class:null,confidence:null };
}
export function summaryFromDemo(result: ScreeningResult, meta: Meta, cycleId: string | null, screenedAt = meta.created_at): ScanSummary {
  if (result.mode !== "mock") throw new Error("Real model summaries require an evaluated integration contract. This build only saves labelled demonstrations.");
  return validateScan({...meta,origin:"demo",cycle_id:cycleId,screened_at:screenedAt,model_version:result.modelVersion,availability:"simulation",demo_label:result.condition,predicted_class:null,confidence:null});
}
