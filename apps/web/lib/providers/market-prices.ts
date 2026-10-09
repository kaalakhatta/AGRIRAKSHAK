// Public Agmarknet monthly reports. No API key, farmer coordinates or private records.
export const MARKET_CROPS = { soybean: { id: 13, name: 'Soyabean' }, wheat: { id: 1, name: 'Wheat' }, chickpea: { id: 6, name: 'Bengal Gram(Gram)(Whole)' } } as const;
export type MarketCrop = keyof typeof MARKET_CROPS;
export type PricePoint = { date: string; minimum: number; maximum: number; modals: number[] };
export type PriceSeries = { market: string; variety: string; points: PricePoint[] };
export type MarketReport = { crop: MarketCrop; unit: 'INR/quintal'; fetched_at: string; source: string; series: PriceSeries[]; partial: boolean };
export function marketCrop(crop: string): MarketCrop | null {
  const key = crop.toLowerCase().replace(/[^a-z]/g, '');
  return key === 'soybean' || key === 'soyabean' ? 'soybean' : key === 'wheat' ? 'wheat' : ['chickpea','gramchickpea','gram'].includes(key) ? 'chickpea' : null;
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Unsupported market report.');
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 120) throw Error('Invalid market or variety.');
  return value.trim();
}
export function marketURL(crop: MarketCrop, year: number, month: number) {
  if (!Object.hasOwn(MARKET_CROPS, crop) || !Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) throw Error('Unsupported market request.');
  const url = new URL('https://api.agmarknet.gov.in/v1/prices-and-arrivals/date-wise/specific-commodity');
  url.search = new URLSearchParams({year:String(year),month:String(month),includeExcel:'false',stateId:'19',commodityId:String(MARKET_CROPS[crop].id)}).toString();
  return url;
}
export function parseMarketMonth(raw: unknown, crop: MarketCrop, year: number, month: number, today: string): PriceSeries[] {
  const root = record(raw);
  const monthName = new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en', {month:'long',timeZone:'UTC'});
  if (root.success !== true || root.title !== `Date Wise Prices for Specified Commodity on ${monthName}, ${year} for Commodity : ${MARKET_CROPS[crop].name}, State/UT : Madhya Pradesh`) throw Error('Market commodity, state or period could not be verified.');
  const columns = root.columns;
  if (!Array.isArray(columns) || !['minimumPrice','maximumPrice','modalPrice'].every(key => columns.some(column => record(column).key === key && record(column).title === `${key === 'minimumPrice' ? 'Minimum' : key === 'maximumPrice' ? 'Maximum' : 'Modal'} Price (Rs./Quintal)`))) throw Error('Market price units could not be verified.');
  if (!Array.isArray(root.markets) || root.markets.length > 1000) throw Error('Unsupported market list.');
  const grouped = new Map<string, PriceSeries>();
  const cutoff = Date.parse(today) - 29 * 86400000;
  for (const value of root.markets) {
    const market = record(value), name = text(market.marketName);
    if (!Array.isArray(market.dates) || market.dates.length > 31) throw Error('Unsupported market dates.');
    for (const item of market.dates) {
      const day = record(item), match = typeof day.arrivalDate === 'string' ? /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(day.arrivalDate) : null;
      if (!match) throw Error('Invalid market report date.');
      const date = `${match[3]}-${match[2]}-${match[1]}`, time = Date.parse(date);
      if (!Number.isFinite(time) || new Date(time).toISOString().slice(0,10) !== date || Number(match[3]) !== year || Number(match[2]) !== month) throw Error('Market date does not match report period.');
      if (!Array.isArray(day.data) || day.data.length > 200) throw Error('Unsupported price rows.');
      if (date > today || time < cutoff) continue;
      for (const row of day.data) {
        const r = record(row), variety = text(r.variety);
        const values = [r.minimumPrice,r.maximumPrice,r.modalPrice];
        // NR/zero/invalid rows stay unavailable; never make missing reports a zero price.
        if (!values.every(v => typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 10000000)) continue;
        const [minimum,maximum,modal] = values as number[];
        if (minimum > modal || modal > maximum) continue;
        const key = JSON.stringify([name,variety]);
        const series = grouped.get(key) ?? {market:name,variety,points:[]};
        let point = series.points.find(point => point.date === date);
        if (!point) { point = {date,minimum,maximum,modals:[]}; series.points.push(point); }
        point.minimum = Math.min(point.minimum,minimum); point.maximum = Math.max(point.maximum,maximum);
        if (!point.modals.includes(modal)) point.modals.push(modal);
        grouped.set(key,series);
      }
    }
  }
  return [...grouped.values()].map(series => ({...series,points:series.points.sort((a,b)=>a.date.localeCompare(b.date)).map(p=>({...p,modals:p.modals.sort((a,b)=>a-b)}))}));
}
export function combineMarketSeries(months: PriceSeries[][]): PriceSeries[] {
  const result = new Map<string, PriceSeries>();
  for (const month of months) for (const series of month) {
    const key = JSON.stringify([series.market,series.variety]), previous = result.get(key);
    if (previous) previous.points.push(...series.points); else result.set(key,structuredClone(series));
  }
  return [...result.values()].map(s=>({...s,points:s.points.sort((a,b)=>a.date.localeCompare(b.date))})).sort((a,b)=>a.market.localeCompare(b.market)||a.variety.localeCompare(b.variety));
}
export async function fetchMarketReport(crop: MarketCrop, http: typeof fetch = fetch, now = Date.now()): Promise<MarketReport> {
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
  const [year,month] = today.split('-').map(Number), previous = new Date(Date.UTC(year,month-2,1));
  const periods = [[year,month],[previous.getUTCFullYear(),previous.getUTCMonth()+1]];
  const results = await Promise.allSettled(periods.map(async ([y,m])=>{
    const response = await http(marketURL(crop,y,m),{headers:{Accept:'application/json','User-Agent':'AgriRakshak educational source verification'},signal:AbortSignal.timeout(10000),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error'});
    if (!response.ok) throw Error('Market reports are temporarily unavailable.');
    const body = await response.text(); if (body.length > 5000000) throw Error('Market report is too large.');
    return parseMarketMonth(JSON.parse(body),crop,y,m,today);
  }));
  const months = results.flatMap(r=>r.status === 'fulfilled' ? [r.value] : []);
  if (!months.length) throw Error('Agmarknet could not be reached. No price estimate has been substituted.');
  return {crop,unit:'INR/quintal',fetched_at:new Date(now).toISOString(),source:'https://agmarknet.gov.in/',series:combineMarketSeries(months),partial:months.length !== periods.length};
}
