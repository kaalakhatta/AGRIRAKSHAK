import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchMarketReport, parseMarketMirror, marketMirrorURL, MARKET_MIRROR_SOURCE } from '../lib/providers/market-prices.ts';
const now=Date.parse('2026-10-12T17:00:00Z');
const row=(patch={})=>({state:'Madhya Pradesh',commodity:'Wheat',market:'Sehore APMC',variety:'Lokwan',grade:'FAQ',arrival_date:'2026-09-24',fetched_at:'2026-09-24T18:00:00Z',min_price:2400,max_price:2800,modal_price:2600,...patch});
const fixture=(data=[row()])=>({success:true,meta:{state:'Madhya Pradesh',commodity:'Wheat'},data});
test('keyless fallback after CAPTCHA failure retains actual reports, dated mirror provenance and incomplete history',async()=>{
  const calls=[];
  const result=await fetchMarketReport('wheat',async(url,options)=>{calls.push(String(url));assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');assert.ok(options.signal);if(url.hostname==='api.agmarknet.gov.in')return Response.json({code:'TOKEN_OR_CAPTCHA_REQUIRED'},{status:400});assert.equal(url.hostname,'mandi-api.onrender.com');assert.equal(url.searchParams.get('state'),'Madhya Pradesh');assert.equal(url.searchParams.get('commodity'),'Wheat');assert.equal(url.searchParams.has('api-key'),false);return Response.json(fixture());},now);
  assert.equal(calls.length,3);assert.equal(result.source,MARKET_MIRROR_SOURCE);assert.equal(result.partial,true);assert.equal(result.mirror_updated_at,'2026-09-24T18:00:00.000Z');assert.equal(result.fetched_at,new Date(now).toISOString());assert.equal(result.series[0].points[0].date,'2026-09-24');assert.deepEqual(result.series[0].points[0].modals,[2600]);assert.ok(calls.every(url=>!url.includes('latitude')));
});
test('mirror preserves variety/grade isolation, exact duplicate modals, numeric strings and immutable input',()=>{
  const data=fixture([row(),row({modal_price:'2700',min_price:'2450',max_price:'2900'}),row({grade:'Non-FAQ',modal_price:2500}),row({market:'Ashta APMC'})]),before=structuredClone(data);
  const report=parseMarketMirror(data,'wheat',now);assert.deepEqual(data,before);assert.equal(report.series.length,3);assert.deepEqual(report.series[0].points[0],{date:'2026-09-24',minimum:2400,maximum:2900,modals:[2600,2700]});assert.equal(report.series[1].variety,'Lokwan (Non-FAQ)');
});
test('mirror rejects wrong source coverage/timestamps and never converts invalid or out-of-window prices to estimates',()=>{
  for(const bad of [{...fixture(),success:false},{...fixture(),meta:{state:'Punjab',commodity:'Wheat'}},fixture([row({state:'Punjab'})]),fixture([row({commodity:'Soyabean'})]),fixture([row({arrival_date:'2026-02-30'})]),fixture([row({fetched_at:'2027-01-01T00:00:00Z'})]),fixture(Array(201).fill(row()))])assert.throws(()=>parseMarketMirror(bad,'wheat',now));
  const invalid=fixture([row({arrival_date:'2026-09-01'}),row({arrival_date:'2026-10-13'}),row({modal_price:null}),row({modal_price:0}),row({modal_price:'NR'}),row({modal_price:9000}),row({min_price:NaN})]);assert.deepEqual(parseMarketMirror(invalid,'wheat',now).series,[]);
  assert.throws(()=>marketMirrorURL('constructor'));
});
test('fallback failure, oversized/HTML response and rate limits fail closed without forwarding sensitive provider details',async()=>{
  for(const reply of [()=>new Response('private details',{status:429}),()=>new Response('<html>private details</html>'),()=>new Response('x'.repeat(1000001)),()=>Response.json({...fixture(),meta:{state:'Punjab'}})])await assert.rejects(fetchMarketReport('wheat',async url=>url.hostname==='api.agmarknet.gov.in'?new Response('',{status:403}):reply(),now),e=>/No price estimate/.test(e.message)&&!e.message.includes('private'));
});
