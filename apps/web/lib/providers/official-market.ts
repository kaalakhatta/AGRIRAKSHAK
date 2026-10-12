import { MARKET_CROPS, marketURL, parseMarketMonth, type MarketCrop, type MarketReport } from './market-prices.ts';

export type MarketCaptcha = {key:string;image:string;expires_at:string};
const agent = 'AgriRakshak college project (human CAPTCHA price refresh)';
export class MarketVerificationError extends Error {
  status:number;
  constructor(message:string, status = 503) { super(message);this.status=status; }
}
export function parseMarketCaptcha(raw: unknown, now: number): MarketCaptcha {
  const data = raw as Record<string,unknown> | null;
  const key = data?.captcha_key, image = data?.captcha_image, mime = data?.image_type;
  // The publisher currently emits an extra Z after its explicit UTC offset.
  const expiry = typeof data?.expires_at === 'string' ? Date.parse(data.expires_at.replace(/\+00:00Z$/, 'Z')) : NaN;
  if (typeof key !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(key) || typeof image !== 'string' || image.length > 200000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(image) || !['image/png','image/jpeg'].includes(String(mime)) || !Number.isFinite(expiry) || expiry <= now || expiry > now + 10*60000) throw new MarketVerificationError('The verification image is unavailable. Try again later.');
  // Only the challenge image/key/expiry are returned. Ignore other provider fields.
  return {key,image:`data:${mime};base64,${image}`,expires_at:new Date(expiry).toISOString()};
}
async function boundedJSON(response:Response, maximum:number):Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw Error('Missing provider response.');
  const decoder = new TextDecoder();let bytes = 0, text = '';
  while (true) {
    const part = await reader.read();if (part.done) break;
    bytes += part.value.byteLength;
    if (bytes > maximum) {await reader.cancel();throw Error('Provider response too large.');}
    text += decoder.decode(part.value,{stream:true});
  }
  return JSON.parse(text+decoder.decode());
}
export async function fetchMarketCaptcha(signal:AbortSignal, http:typeof fetch = fetch, clock = Date.now):Promise<MarketCaptcha> {
  if (signal.aborted) throw new MarketVerificationError('Verification canceled.',400);
  try {
    const response = await http('https://api.agmarknet.gov.in/v1/captcha/generator', {method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json','User-Agent':agent},body:JSON.stringify({headers:{'Content-Type':'application/json'}}),signal:AbortSignal.any([signal,AbortSignal.timeout(10000)]),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error'});
    if (response.status === 429) throw new MarketVerificationError('Please wait a minute before requesting another verification image.',429);
    if (!response.ok) throw Error('Unavailable.');
    return parseMarketCaptcha(await boundedJSON(response,300000),clock());
  } catch (error) {if (error instanceof MarketVerificationError) throw error;throw new MarketVerificationError('The verification image is unavailable. Try again later.');}
}
export async function fetchVerifiedMarket(crop:MarketCrop, verification:unknown, signal:AbortSignal, http:typeof fetch = fetch, now = Date.now()):Promise<MarketReport> {
  if (signal.aborted) throw new MarketVerificationError('Verification canceled.',400);
  const input = verification as Record<string,unknown> | null;
  if (!Object.hasOwn(MARKET_CROPS,crop) || typeof input?.captcha_key !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(input.captcha_key) || typeof input?.captcha !== 'string' || !/^[A-Za-z0-9]{1,12}$/.test(input.captcha.trim())) throw new MarketVerificationError('Enter the verification characters shown in the image.',400);
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
  const [year,month] = today.split('-').map(Number), url = marketURL(crop,year,month);
  url.searchParams.set('captcha_key',input.captcha_key);url.searchParams.set('captcha',input.captcha.trim());
  try {
    const response = await http(url,{headers:{Accept:'application/json','User-Agent':agent},signal:AbortSignal.any([signal,AbortSignal.timeout(10000)]),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error'});
    if ([400,401,403].includes(response.status)) throw new MarketVerificationError('Verification failed or expired. Get a new CAPTCHA and try again.',400);
    if (response.status === 429) throw new MarketVerificationError('Agmarknet is rate limited. Please wait a minute and try again.',429);
    if (!response.ok) throw Error('Unavailable.');
    const series = parseMarketMonth(await boundedJSON(response,5000000),crop,year,month,today);
    // A challenge authorizes this requested month; do not reuse it for another request.
    return {crop,unit:'INR/quintal',fetched_at:new Date(now).toISOString(),source:'https://agmarknet.gov.in/',series,partial:true,report_month:today.slice(0,7)};
  } catch (error) {if (error instanceof MarketVerificationError) throw error;throw new MarketVerificationError('Official prices could not be fetched. The previous report is unchanged.');}
}
