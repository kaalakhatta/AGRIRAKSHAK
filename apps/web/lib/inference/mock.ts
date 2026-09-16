import type { InferenceProvider } from "./types";

const MOCK_DELAY_MS = 650;

export const runMockInference: InferenceProvider = async () => {
  await new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS));
  return {
    modelVersion: "interface-mock-v1",
    crop: "Tomato",
    condition: "Early blight pattern",
    confidence: 0.82,
    uncertaintyThreshold: 0.7,
    summary: "The final product will connect an evaluated prediction to reviewed symptom and prevention content.",
    uncertainMessage: "Try another photograph in natural light, keep one leaf in focus, or ask a qualified agriculture professional to review the plant.",
    mode: "mock",
  };
};
