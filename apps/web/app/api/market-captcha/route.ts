import { fetchMarketCaptcha, MarketVerificationError } from '@/lib/providers/official-market';
export const maxDuration = 15;
export async function GET(request:Request) {
  const headers = {'Cache-Control':'no-store'};
  try {return Response.json(await fetchMarketCaptcha(request.signal),{headers});}
  catch (error) {
    const failure = error instanceof MarketVerificationError ? error : new MarketVerificationError('The verification image is unavailable.');
    return Response.json({error:failure.message},{status:failure.status,headers:{...headers,...(failure.status===429?{'Retry-After':'60'}:{})}});
  }
}
