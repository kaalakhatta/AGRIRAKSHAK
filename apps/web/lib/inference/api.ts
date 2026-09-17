import type { InferenceProvider, ScreeningResult } from "./types";

type ApiPrediction = {
  crop: string;
  condition: string;
  confidence: number;
  uncertain: boolean;
  uncertainty_threshold: number;
  model_version: string;
};

type ApiError = { detail?: string };

export const runApiInference: InferenceProvider = async (file) => {
  const body = new FormData();
  body.append("image", file);
  const response = await fetch("/api/predict", { method: "POST", body });
  const payload = (await response.json().catch(() => ({}))) as ApiPrediction & ApiError;
  if (!response.ok) {
    throw new Error(payload.detail || "The analysis service could not process this image.");
  }
  return {
    modelVersion: payload.model_version,
    crop: payload.crop,
    condition: payload.condition,
    confidence: payload.confidence,
    uncertaintyThreshold: payload.uncertainty_threshold,
    summary: "This is a preliminary model screening, not a confirmed diagnosis.",
    uncertainMessage:
      "The model is not confident enough. Try another photograph in natural light or ask a qualified agriculture professional to review the plant.",
    mode: "onnx",
  } satisfies ScreeningResult;
};

