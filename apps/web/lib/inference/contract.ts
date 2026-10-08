import type { ScreeningResult } from "./types.ts";
export const SCANNER_CROPS = ["Pepper", "Potato", "Tomato"] as const;
export type ScannerCrop = typeof SCANNER_CROPS[number];
export function parsePrediction(raw: unknown, expectedCrop: ScannerCrop): ScreeningResult {
  const fail = (): never => { throw new Error("The analysis service returned an unsupported result. No diagnosis was made."); };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail();
  const data = raw as Record<string, unknown>;
  const text = (value: unknown): value is string => typeof value === "string" && !!value.trim() && value.length <= 200;
  const probability = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
  if (!text(data.model_version) || !text(data.crop) || !text(data.condition) || !probability(data.confidence) || !probability(data.uncertainty_threshold) || typeof data.uncertain !== "boolean" || data.uncertain !== (data.confidence < data.uncertainty_threshold)) return fail();
  const crop = ["Pepper", "Pepper, bell"].includes(data.crop) ? "Pepper" : data.crop;
  if (crop === "Unsupported" || crop === "Unknown crop" || crop !== expectedCrop) throw new Error("This image is outside the selected crop coverage. No supported crop result is available; try a suitable leaf image or seek expert review.");
  return { modelVersion: data.model_version, crop: data.crop, condition: data.condition, confidence: data.confidence, uncertaintyThreshold: data.uncertainty_threshold,
    summary: "Preliminary model screening, not a confirmed diagnosis. The existing baseline does not cover soybean, wheat or chickpea.",
    uncertainMessage: "The model is not confident enough. Try a clearer photograph or ask a qualified agriculture professional to review the plant.", mode: "onnx" };
}
