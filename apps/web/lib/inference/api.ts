import { parsePrediction, type ScannerCrop } from "./contract.ts";
export async function runApiInference(file: File, crop: ScannerCrop, signal: AbortSignal, http: typeof fetch = fetch) {
  const body = new FormData(); body.append("image", file, "leaf-image");
  let response: Response;
  try { response = await http("/api/predict", { method: "POST", body, signal, cache: "no-store" }); }
  catch { throw new Error(signal.aborted ? "Screening was stopped. No result was saved." : "The analysis server could not be reached. No prediction was made; farm records and the labelled interface demo remain available."); }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(response.status === 503 ? "The disease model is unavailable. No prediction was made. You can continue with your farm records." : "The analysis service could not process this image. Check the image and try again.");
  return parsePrediction(payload, crop);
}
