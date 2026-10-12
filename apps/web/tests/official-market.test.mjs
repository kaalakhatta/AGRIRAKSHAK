import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMarketCaptcha, fetchMarketCaptcha, fetchVerifiedMarket } from '../lib/providers/official-market.ts';
const now=Date.parse('2026-10-12T18:00:00Z');
// Synthetic transport fixtures only; these are not real CAPTCHA challenges/prices.
const challenge=()=>({captcha_key:'synthetic-key',captcha_image:btoa('synthetic PNG fixture'),image_type:'image/png',image_decode:'private provider field',expires_at:'2026-10-12T18:05:00.000000+00:00Z'});
const proof={captcha_key:'synthetic-key',captcha:'ABC123'};
const month=()=>({success:true,title:'Date Wise Prices for Specified Commodity on October, 2026 for Commodity : Wheat, State/UT : Madhya Pradesh',columns:['minimumPrice','maximumPrice','modalPrice'].map((key,i)=>({key,title:`${['Minimum','Maximum','Modal'][i]} Price (Rs./Quintal)`})),markets:[{marketName:'Synthetic Test APMC',dates:[{arrivalDate:'12/10/2026',data:[{variety:'Synthetic variety',minimumPrice:2500,maximumPrice:2700,modalPrice:2600}]}]}]});
test('CAPTCHA parser normalizes the published expiry format, strips extra fields and rejects expired/future/non-image challenges',()=>{
  const parsed=parseMarketCaptcha(challenge(),now);assert.deepEqual(Object.keys(parsed).sort(),['expires_at','image','key']);assert.equal(parsed.expires_at,'2026-10-12T18:05:00.000Z');assert.ok(parsed.image.startsWith('data:image/png;base64,'));assert.ok(!JSON.stringify(parsed).includes('private'));
  for(const patch of [{captcha_key:'../secret'},{captcha_image:'<svg/>'},{image_type:'image/svg+xml'},{captcha_image:'x'.repeat(200001)},{expires_at:'2026-10-12T17:00:00Z'},{expires_at:'2026-10-12T19:00:00Z'},{expires_at:'bad'}])assert.throws(()=>parseMarketCaptcha({...challenge(),...patch},now));
});
test('generator uses the fixed publisher POST format, explicit project identity and privacy/timeout controls',async()=>{
  const c=new AbortController();const result=await fetchMarketCaptcha(c.signal,async(url,options)=>{assert.equal(url,'https://api.agmarknet.gov.in/v1/captcha/generator');assert.equal(options.method,'POST');assert.deepEqual(JSON.parse(options.body),{headers:{'Content-Type':'application/json'}});assert.match(options.headers['User-Agent'],/AgriRakshak/);assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');assert.ok(options.signal);return Response.json(challenge());},()=>now);assert.equal(result.key,'synthetic-key');
});
test('human proof authorizes exactly one current-month/crop request; fresh reports keep original dates, units and partial history',async()=>{
  let calls=0;const c=new AbortController(),before=structuredClone(proof);
  const report=await fetchVerifiedMarket('wheat',proof,c.signal,async(url,options)=>{calls++;assert.equal(url.hostname,'api.agmarknet.gov.in');assert.equal(url.searchParams.get('captcha'),'ABC123');assert.equal(url.searchParams.get('captcha_key'),'synthetic-key');assert.equal(url.searchParams.get('commodityId'),'1');assert.equal(url.searchParams.get('stateId'),'19');assert.equal(url.searchParams.get('month'),'10');assert.equal(url.searchParams.get('year'),'2026');assert.equal(url.searchParams.has('latitude'),false);assert.equal(options.credentials,'omit');return Response.json(month());},now);
  assert.equal(calls,1);assert.deepEqual(proof,before);assert.equal(report.source,'https://agmarknet.gov.in/');assert.equal(report.report_month,'2026-10');assert.equal(report.partial,true);assert.equal(report.unit,'INR/quintal');assert.equal(report.series[0].points[0].date,'2026-10-12');assert.equal(report.series[0].points[0].modals[0],2600);assert.ok(!JSON.stringify(report).includes('ABC123'));
});
test('expired/wrong CAPTCHA and rate limits are explicit safe failures, never retried or replaced by old mirror prices',async()=>{
  for(const [status,expected] of [[400,400],[401,400],[403,400],[429,429],[500,503]]){let calls=0;await assert.rejects(fetchVerifiedMarket('wheat',proof,new AbortController().signal,async()=>{calls++;return Response.json({detail:'private provider data',captcha:'ABC123'},{status});},now),e=>e.status===expected&&!e.message.includes('private')&&!e.message.includes('ABC123'));assert.equal(calls,1);}
});
test('malformed proof and cancellation fail before contacting the provider',async()=>{
  const http=async()=>{throw Error('must not contact provider');};
  for(const input of [null,{}, {...proof,captcha_key:'https://evil.invalid'}, {...proof,captcha:'x'.repeat(13)}, {...proof,captcha:'<script>'}])await assert.rejects(fetchVerifiedMarket('wheat',input,new AbortController().signal,http,now),e=>e.status===400);
  await assert.rejects(fetchVerifiedMarket('constructor',proof,new AbortController().signal,http,now),e=>e.status===400);
  const c=new AbortController();c.abort();await assert.rejects(fetchVerifiedMarket('wheat',proof,c.signal,http,now),/canceled/);await assert.rejects(fetchMarketCaptcha(c.signal,http,()=>now),/canceled/);
});
test('HTML, oversized provider bodies and incorrect crop/units reject without accepting or relabelling prices',async()=>{
  const badUnits=month();badUnits.columns=[];
  for(const body of ['<html>private</html>','x'.repeat(5000001),JSON.stringify({...month(),title:'Wrong crop'}),JSON.stringify(badUnits)])await assert.rejects(fetchVerifiedMarket('wheat',proof,new AbortController().signal,async()=>new Response(body),now),e=>e.status===503&&!e.message.includes('private'));
  await assert.rejects(fetchMarketCaptcha(new AbortController().signal,async()=>new Response('x'.repeat(300001)),()=>now),e=>e.status===503);
});
