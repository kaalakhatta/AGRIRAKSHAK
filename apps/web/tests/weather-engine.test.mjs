import test from 'node:test';
import assert from 'node:assert/strict';
import { WeatherClient, parseWeather, weatherFresh, setupWeatherTransport, CACHE_MS } from '../lib/providers/weather.ts';
import { validateCatalog, evaluateCatalog } from '../lib/recommendations/engine.ts';
const NOW = Date.parse('2026-10-05T12:05:00Z');
function weather() { return { utc_offset_seconds:0,timezone:'GMT',current:{time:'2026-10-05T12:00',interval:900,temperature_2m:24,relative_humidity_2m:50,precipitation:0,wind_speed_10m:2},current_units:{temperature_2m:'°C',relative_humidity_2m:'%',precipitation:'mm',wind_speed_10m:'m/s'},daily_units:{temperature_2m_min:'°C',temperature_2m_max:'°C',precipitation_sum:'mm'},daily:{time:Array.from({length:7},(_,i)=>`2026-10-${String(5+i).padStart(2,'0')}`),temperature_2m_min:Array(7).fill(20),temperature_2m_max:Array(7).fill(30),precipitation_sum:Array(7).fill(0)}}; }
const response = body => new Response(JSON.stringify(body),{status:200});
test('weather preserves valid time, interval, missing values and unknown issuance; excludes provider coordinates',()=>{
 const w=weather(); w.latitude=0; w.current.temperature_2m=null;
 const result=parseWeather(w,NOW); assert.equal(result.current.temperature,null);assert.equal(result.issued_at,null);assert.equal(result.interval_seconds,900);assert.equal(result.observed_at,'2026-10-05T12:00:00.000Z');assert.ok(!('latitude' in result));assert.ok(weatherFresh(result,NOW));assert.ok(!weatherFresh(result,NOW+CACHE_MS));
});
test('weather rejects wrong units, future time, malformed days, missing interval and impossible ranges',()=>{
 for(const change of [w=>w.current_units.wind_speed_10m='km/h',w=>w.current.time='2026-10-05T13:00',w=>w.daily.time[0]='2026-02-30',w=>delete w.current.interval,w=>w.current.relative_humidity_2m=101,w=>w.daily.temperature_2m_min[0]=40]){const w=weather();change(w);assert.throws(()=>parseWeather(w,NOW));}
});
test('weather cache isolates coordinates, throttle spans fields, refresh and expiry respect budget',async()=>{
 let time=NOW,calls=0;const c=new WeatherClient(async url=>{calls++;assert.equal(new URL(url).searchParams.get('wind_speed_unit'),'ms');return response(weather());},()=>time,async()=>{});
 await c.get(0,0);await c.get(0,0);assert.equal(calls,1);await assert.rejects(c.get(0,1),/wait/);await assert.rejects(c.get(0,0,true),/wait/);time+=60000;await c.get(0,1);assert.equal(calls,2);c.clear();assert.equal(c.cached(0,0),undefined);
});
test('setup weather transport sends only coordinates in a same-origin POST, preserves abort/privacy and validates provider results',async()=>{
 let calls=0;
 const client=new WeatherClient(setupWeatherTransport(async(url,options)=>{
  calls++;assert.equal(url,'/api/weather-context');assert.equal(options.method,'POST');assert.deepEqual(JSON.parse(options.body),{latitude:23,longitude:77});assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');assert.equal(options.cache,'no-store');assert.ok(options.signal);return response(weather());
 }),()=>NOW,async()=>{});
 const result=await client.get(23,77);assert.equal(result.current.temperature,24);assert.equal(result.interval_seconds,900);assert.equal(calls,1);
 await assert.rejects(setupWeatherTransport(async()=>{throw Error('must not transmit');})('https://example.com/forecast'),/Unsupported/);
 const bad=weather();bad.current_units.wind_speed_10m='km/h';const invalid=new WeatherClient(setupWeatherTransport(async()=>response(bad)),()=>NOW,async()=>{});await assert.rejects(invalid.get(23,77),/units/);assert.equal(invalid.cached(23,77),undefined);
});
test('transient weather failure retries once; 429 honors Retry-After without retry; old cache survives failure',async()=>{
 let calls=0;const c=new WeatherClient(async()=>{calls++;return calls===1?new Response('',{status:503}):response(weather());},()=>NOW,async()=>{});await c.get(0,0);assert.equal(calls,2);
 let time=NOW;calls=0;const limited=new WeatherClient(async()=>{calls++;return new Response('',{status:429,headers:{'Retry-After':'120'}});},()=>time,async()=>{});await assert.rejects(limited.get(0,0),e=>e.retryAt===NOW+120000);time+=60000;await assert.rejects(limited.get(0,0),/wait/);assert.equal(calls,1);
 let fail=false;const offline=new WeatherClient(async()=>{if(fail)throw new Error('URL with sensitive coordinate');return response(weather());},()=>time,async()=>{});const old=await offline.get(0,0);fail=true;time+=60000;await assert.rejects(offline.get(0,0,true),e=>!e.message.includes('sensitive'));assert.deepEqual(offline.cached(0,0),old);
});
// Synthetic logic-test catalog only: reviewer/evidence are fixtures, never runtime advice.
function catalog(){return {schema_version:'engine-1',version:'synthetic-test-only',evidence:[{id:'fixture',url:'https://example.com/synthetic-fixture',verified:true}],rules:[{id:'test',version:'1',title:'Synthetic logic fixture',action:'Test-only action',review:{status:'reviewed',reviewer:'SYNTHETIC TEST REVIEWER',reviewed_at:'2026-10-01T00:00:00Z'},evidence:['fixture'],applicability:{crop:['test-crop']},required_inputs:[{input:'crop',unit:'text',kinds:['user'],max_age_seconds:null},{input:'air_temperature',unit:'degC',kinds:['weather_estimate'],max_age_seconds:1800}],condition:{op:'gte',input:'air_temperature',value:20},contraindications:[],conflict_group:null}]};}
function inputs(){return {crop:{field_id:'field',value:'test-crop',unit:'text',kind:'user',observed_at:'2026-10-01T00:00:00Z',synthetic:false},air_temperature:{field_id:'field',value:24,unit:'degC',kind:'weather_estimate',observed_at:'2026-10-05T12:00:00Z',synthetic:false}};}
const status=(c=catalog(),i=inputs())=>evaluateCatalog(c,'field',i,NOW)[0].status;
test('deterministic reviewed fixture explains match and source without mutation',()=>{
 const c=catalog(),i=inputs(),before=JSON.stringify([c,i]);const a=evaluateCatalog(c,'field',i,NOW);assert.equal(a[0].status,'matched');assert.deepEqual(a,evaluateCatalog(c,'field',i,NOW));assert.ok(a[0].reasons.length);assert.equal(a[0].evidence[0],c.evidence[0].url);assert.equal(JSON.stringify([c,i]),before);
});
test('draft, missing reviewer, future review and unverified evidence never match',()=>{
 for(const change of [c=>c.rules[0].review.status='draft',c=>c.rules[0].review.reviewer=null,c=>c.rules[0].review.reviewed_at='2027-01-01T00:00:00Z',c=>c.evidence[0].verified=false,c=>c.rules[0].evidence=[]]){const c=catalog();change(c);assert.equal(status(c),'unreviewed');}
});
test('unknown, stale, mismatched coverage, wrong provenance, synthetic and mixed-field evidence abstain',()=>{
 for(const [change,expected] of [[i=>delete i.crop,'needs_input'],[i=>i.crop.value='other','ineligible'],[i=>i.air_temperature.observed_at='2026-10-05T10:00:00Z','stale'],[i=>i.air_temperature.observed_at='2026-10-06T00:00:00Z','needs_input'],[i=>i.air_temperature.unit='mm','blocked'],[i=>i.air_temperature.kind='soil_map','blocked'],[i=>i.air_temperature.synthetic=true,'blocked'],[i=>i.crop.field_id='other','blocked']]){const i=inputs();change(i);assert.equal(status(catalog(),i),expected);}
});
test('depth and precipitation interval are explicit; numeric comparison cannot coerce text',()=>{
 const c=catalog();c.rules[0].required_inputs[1].depth_cm={top:0,bottom:10};assert.equal(status(c),'blocked');const i=inputs();i.air_temperature.depth_cm={top:0,bottom:10};assert.equal(status(c,i),'matched');i.air_temperature.value='24';assert.equal(status(c,i),'blocked');c.rules[0].required_inputs[1].input='precipitation';assert.throws(()=>validateCatalog(c));
});
test('contraindications and conflicting reviewed rules suppress actions',()=>{
 const c=catalog();c.rules[0].contraindications=[{op:'exists',input:'air_temperature'}];assert.equal(status(c),'blocked');c.rules[0].contraindications=[];c.rules[0].conflict_group='test-conflict';c.rules.push({...structuredClone(c.rules[0]),id:'second'});assert.deepEqual(evaluateCatalog(c,'field',inputs(),NOW).map(x=>x.status),['blocked','blocked']);
});
test('catalog rejects code injection, dangling references, unbounded recursion and unknown units',()=>{
 for(const change of [c=>c.rules[0].condition={op:'eval',input:'crop',value:'alert(1)'},c=>c.rules[0].condition.input='missing',c=>c.rules[0].required_inputs[1].unit='km/h',c=>c.rules[0].evidence=['missing'],c=>{for(let n=0;n<15;n++)c.rules[0].condition={op:'all',conditions:[c.rules[0].condition]};}]){const c=catalog();change(c);assert.throws(()=>validateCatalog(c));}
});
test('stopping sharing aborts in-flight fetch and prevents repopulating cache',async()=>{
 let finish;const c=new WeatherClient((_url,options)=>new Promise(resolve=>{finish=()=>resolve(response(weather()));assert.ok(options.signal);}),()=>NOW,async()=>{});
 const request=c.get(0,0);c.clear();finish();await assert.rejects(request,/stopped/);assert.equal(c.cached(0,0),undefined);
});
