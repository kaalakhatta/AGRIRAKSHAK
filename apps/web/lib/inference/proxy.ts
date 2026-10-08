const MAX_BYTES = 10 * 1024 * 1024;
const error = (detail: string, status: number) => Response.json({detail}, {status, headers:{"Cache-Control":"no-store"}});
export async function proxyPrediction(request: Request, endpoint: string | undefined, http: typeof fetch = fetch) {
  if (!endpoint) return error("The real disease model is not configured. No prediction was made.",503);
  let url: URL;
  try { url = new URL(endpoint); } catch { return error("The disease-analysis service is unavailable.",503); }
  if (url.username || url.password || url.search || url.hash || !(url.protocol === "https:" || url.protocol === "http:" && ["127.0.0.1","localhost","[::1]"].includes(url.hostname))) return error("The disease-analysis service is unavailable.",503);
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BYTES + 1_000_000)) return error("Upload a non-empty image no larger than 10 MB.",413);
  // Bound multipart bodies even when Content-Length is absent.
  const chunks: Uint8Array[] = [], reader = request.body?.getReader(); let size = 0;
  if (!reader) return error("Choose a leaf image before analyzing.",400);
  try {
    while (true) { const {done,value} = await reader.read(); if (done) break; size += value.byteLength; if (size > MAX_BYTES + 1_000_000) { await reader.cancel(); return error("Upload a non-empty image no larger than 10 MB.",413); } chunks.push(value); }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
    const body = await new Request("http://localhost/", {method:"POST",headers:{"content-type":request.headers.get("content-type") ?? ""},body:bytes}).formData();
    const image = body.get("image");
    if (!(image instanceof File)) return error("Choose a leaf image before analyzing.",400);
    if (!["image/jpeg","image/png","image/webp"].includes(image.type)) return error("Upload a JPG, PNG or WebP image.",415);
    if (!image.size || image.size > MAX_BYTES) return error("Upload a non-empty image no larger than 10 MB.",413);
    const upstreamBody = new FormData(); upstreamBody.append("image",image,"leaf-image");
    url.pathname = url.pathname.replace(/\/$/,"") + "/v1/predict";
    const upstream = await http(url, {method:"POST",body:upstreamBody,cache:"no-store",signal:AbortSignal.any([request.signal,AbortSignal.timeout(90_000)])});
    if (!upstream.ok) return error(upstream.status === 400 || upstream.status === 415 || upstream.status === 413 ? "This image could not be processed. Use a valid JPG, PNG or WebP under 10 MB." : "The disease-analysis service is unavailable. No prediction was made.", [400,413,415].includes(upstream.status) ? upstream.status : 503);
    const payload: unknown = await upstream.json();
    return Response.json(payload,{headers:{"Cache-Control":"no-store"}});
  } catch { return error("The disease-analysis service is unavailable. No prediction was made.",503); }
}
