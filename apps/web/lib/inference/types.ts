export type ScreeningResult = {
  modelVersion: string;
  crop: string;
  condition: string;
  confidence: number;
  uncertaintyThreshold: number;
  summary: string;
  uncertainMessage: string;
  mode: "mock" | "onnx";
};

export type InferenceProvider = (file: File) => Promise<ScreeningResult>;
