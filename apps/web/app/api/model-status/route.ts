import { modelReadiness } from '@/lib/inference/readiness';

export const maxDuration = 60;
export async function GET(request: Request) {
  return modelReadiness(request, process.env.INFERENCE_API_URL);
}
