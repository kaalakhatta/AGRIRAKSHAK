import { proxyPrediction } from "@/lib/inference/proxy";
export const runtime = "nodejs";
export async function POST(request: Request) { return proxyPrediction(request, process.env.INFERENCE_API_URL); }
