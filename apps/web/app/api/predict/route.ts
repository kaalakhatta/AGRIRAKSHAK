const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiUrl = process.env.INFERENCE_API_URL?.replace(/\/$/, "");
  if (!apiUrl) {
    return Response.json(
      { detail: "The real disease model is not deployed yet. No prediction was made." },
      { status: 503 },
    );
  }

  const incoming = await request.formData().catch(() => null);
  const image = incoming?.get("image");
  if (!(image instanceof File)) {
    return Response.json({ detail: "Choose a leaf image before analyzing." }, { status: 400 });
  }
  if (!ACCEPTED_TYPES.has(image.type)) {
    return Response.json({ detail: "Upload a JPG, PNG, or WebP image." }, { status: 415 });
  }
  if (!image.size || image.size > MAX_FILE_BYTES) {
    return Response.json({ detail: "Upload a non-empty image no larger than 10 MB." }, { status: 413 });
  }

  const upstreamBody = new FormData();
  upstreamBody.append("image", image, image.name);
  try {
    const upstream = await fetch(`${apiUrl}/v1/predict`, {
      method: "POST",
      body: upstreamBody,
      cache: "no-store",
      signal: AbortSignal.timeout(90_000),
    });
    const responseBody = await upstream.text();
    return new Response(responseBody, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
    });
  } catch {
    return Response.json(
      { detail: "The disease-analysis service is unavailable. Please try again shortly." },
      { status: 503 },
    );
  }
}
