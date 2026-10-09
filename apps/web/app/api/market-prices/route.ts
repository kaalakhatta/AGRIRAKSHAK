import { fetchMarketReport, MARKET_CROPS, type MarketCrop, type MarketReport } from '@/lib/providers/market-prices';
export const runtime = 'nodejs';
const cache = new Map<MarketCrop,{report:MarketReport;expires:number}>();
const pending = new Map<MarketCrop,Promise<MarketReport>>();
const retry = new Map<MarketCrop,number>();
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('crop');
  const headers = {'Cache-Control':'no-store'};
  if (!key || !Object.hasOwn(MARKET_CROPS,key)) return Response.json({error:'Choose soybean, wheat or chickpea.'},{status:400,headers});
  const crop = key as MarketCrop, saved = cache.get(crop);
  if (saved && saved.expires > Date.now()) return Response.json(saved.report,{headers});
  if ((retry.get(crop)??0)>Date.now()) return Response.json({error:'Market service is unavailable. Try again in a minute.'},{status:503,headers:{...headers,'Retry-After':'60'}});
  try {
    let work = pending.get(crop);
    if (!work) { work = fetchMarketReport(crop); pending.set(crop,work); }
    const report = await work;
    cache.set(crop,{report,expires:Date.now()+15*60000});
    return Response.json(report,{headers});
  } catch { retry.set(crop,Date.now()+60000); return Response.json({error:'Agmarknet reports are unavailable. Retry when connected; no replacement prices are shown.'},{status:503,headers}); }
  finally {pending.delete(crop);}
}
