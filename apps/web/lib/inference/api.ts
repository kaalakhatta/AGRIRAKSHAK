import { parsePrediction, type ScannerCrop } from "./contract.ts";
export async function runApiInference(file: File, crop: ScannerCrop, signal: AbortSignal, http: typeof fetch = fetch, progress: (message: string) => void = () => {}) {
  if (signal.aborted) throw new Error('Screening was stopped. No result was saved.');
  progress('Starting the model server… Free hosting may take about a minute. Your image has not been sent yet.');
  try {
    const ready = await http('/api/model-status', {signal:AbortSignal.any([signal,AbortSignal.timeout(55_000)]),cache:'no-store',credentials:'omit'});
    const data: unknown = await ready.json();
    if (!ready.ok || !data || typeof data !== 'object' || !('status' in data) || data.status !== 'ready') throw Error('not ready');
  } catch {
    throw new Error(signal.aborted ? 'Screening was stopped. No result was saved.' : 'The model server has not become ready. Wait a moment and try Analyze leaf again. Your image was not sent.');
  }
  if (signal.aborted) throw new Error('Screening was stopped. No result was saved.');
  progress('Analyzing leaf…');
  const body = new FormData(); body.append("image", file, "leaf-image");
  let response: Response;
  try { response = await http("/api/predict", { method: "POST", body, signal, cache: "no-store" }); }
  catch { throw new Error(signal.aborted ? "Screening was stopped. No result was saved." : "The analysis server could not be reached. No prediction was made; farm records and the labelled interface demo remain available."); }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(response.status === 503 ? "The disease model is unavailable. No prediction was made. You can continue with your farm records." : "The analysis service could not process this image. Check the image and try again.");
  return parsePrediction(payload, crop);
}
