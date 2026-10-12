export function modelURL(endpoint: string | undefined, path: string): URL | null {
  if (!endpoint) return null;
  try {
    const url = new URL(endpoint);
    if (url.username || url.password || url.search || url.hash || !(url.protocol === 'https:' || url.protocol === 'http:' && ['127.0.0.1','localhost','[::1]'].includes(url.hostname))) return null;
    url.pathname = url.pathname.replace(/\/$/, '') + path;
    return url;
  } catch { return null; }
}

// Wake/check the configured backend without transmitting an image.
export async function modelReadiness(request: Request, endpoint: string | undefined, http: typeof fetch = fetch) {
  const headers = {'Cache-Control':'no-store'};
  const unavailable = () => Response.json({status:'unavailable'}, {status:503,headers});
  const url = modelURL(endpoint, '/health/ready');
  if (!url || request.signal.aborted) return unavailable();
  try {
    const response = await http(url, {cache:'no-store',redirect:'error',signal:AbortSignal.any([request.signal,AbortSignal.timeout(45_000)])});
    if (!response.ok) return unavailable();
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object' || !('status' in data) || data.status !== 'ready') return unavailable();
    return Response.json({status:'ready'}, {headers});
  } catch { return unavailable(); }
}
