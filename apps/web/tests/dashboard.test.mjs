import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMarketMonth, marketURL, marketCrop, combineMarketSeries, fetchMarketReport } from '../lib/providers/market-prices.ts';
import { maturityEstimate, calendarCells, seasonMarks } from '../lib/domain/season-estimates.ts';
import { createFieldSetup } from '../lib/domain/field-setup.ts';
import { emptyData } from '../lib/domain/farm.ts';
const now='2026-10-09T05:00:00.000Z';
const opts={name:'Synthetic dashboard fixture',district:'Sehore',coordinates:null,remember:false,crop:'soybean',season:'Kharif',water:'supplemental',planted:true,variety:'JS 20-34',sowing_date:'2026-07-10'};
const fixture=(rows=[{arrivalDate:'08/10/2026',data:[{variety:'Yellow',minimumPrice:2500,maximumPrice:6345,modalPrice:6000},{variety:'Yellow',minimumPrice:2800,maximumPrice:6432,modalPrice:6100}]}])=>({success:true,title:'Date Wise Prices for Specified Commodity on October, 2026 for Commodity : Soyabean, State/UT : Madhya Pradesh',columns:['minimumPrice','maximumPrice','modalPrice'].map((key,i)=>({key,title:`${['Minimum','Maximum','Modal'][i]} Price (Rs./Quintal)`})),markets:[{marketName:'Sehore APMC',dates:rows}]});
test('public market requests use verified MP/crop IDs; unknown or hostile crops never construct a provider request',()=>{
 assert.equal(marketURL('soybean',2026,10).searchParams.get('commodityId'),'13');assert.equal(marketURL('wheat',2026,10).searchParams.get('commodityId'),'1');assert.equal(marketURL('chickpea',2026,10).searchParams.get('commodityId'),'6');assert.equal(marketURL('soybean',2026,10).searchParams.get('stateId'),'19');
 assert.equal(marketCrop('Gram/chickpea'),'chickpea');assert.equal(marketCrop('Soyabean'),'soybean');assert.equal(marketCrop('constructor'),null);assert.throws(()=>marketURL('constructor',2026,10));assert.throws(()=>marketURL('soybean',2026,13));
});
test('daily duplicate modal reports remain separate, no invented average, and prices keep market/variety isolation',()=>{
 const raw=fixture(),before=structuredClone(raw);raw.markets.push({marketName:'Ashta APMC',dates:[{arrivalDate:'08/10/2026',data:[{variety:'Yellow',minimumPrice:2000,maximumPrice:4000,modalPrice:3500}]}]});
 const parsed=parseMarketMonth(raw,'soybean',2026,10,'2026-10-09');assert.equal(parsed.length,2);assert.deepEqual(parsed[0].points[0],{date:'2026-10-08',minimum:2500,maximum:6432,modals:[6000,6100]});assert.equal(parsed[1].points[0].modals[0],3500);assert.deepEqual(raw.markets[0],before.markets[0]);
});
test('missing/invalid/future prices stay unavailable and report commodity/state/units/period are verified',()=>{
 const rows=[{arrivalDate:'09/10/2026',data:[{variety:'Yellow',minimumPrice:0,maximumPrice:0,modalPrice:0},{variety:'Yellow',minimumPrice:100,maximumPrice:500,modalPrice:'NR'},{variety:'Yellow',minimumPrice:500,maximumPrice:100,modalPrice:200}]},{arrivalDate:'10/10/2026',data:[{variety:'Yellow',minimumPrice:100,maximumPrice:500,modalPrice:200}]}];
 assert.deepEqual(parseMarketMonth(fixture(rows),'soybean',2026,10,'2026-10-09'),[]);
 for(const patch of [{title:'different crop'},{success:false},{columns:[]}])assert.throws(()=>parseMarketMonth({...fixture(),...patch},'soybean',2026,10,'2026-10-09'));
 assert.throws(()=>parseMarketMonth(fixture([{arrivalDate:'31/10/2026',data:[]}]),'soybean',2026,9,'2026-10-09'));
 assert.throws(()=>parseMarketMonth(fixture([{arrivalDate:'32/10/2026',data:[]}]),'soybean',2026,10,'2026-10-09'));
});
test('bounded fetch merges actual months, preserves partial history on independent failure and fails without substitute prices',async()=>{
 const requests=[];const result=await fetchMarketReport('soybean',async(url,init)=>{requests.push(String(url));assert.ok(init.signal);assert.equal(init.credentials,'omit');assert.ok(!String(url).includes('latitude'));return url.searchParams.get('month')==='10'?Response.json(fixture()):new Response('',{status:503});},Date.parse(now));
 assert.equal(result.partial,true);assert.equal(result.series[0].points.length,1);assert.equal(requests.length,2);assert.equal(result.unit,'INR/quintal');assert.equal(result.fetched_at,now);assert.deepEqual(combineMarketSeries([result.series]),result.series);
 await assert.rejects(fetchMarketReport('soybean',async()=>new Response('',{status:403}),Date.parse(now)),/No price estimate/);
});
test('calendar calculates source-backed variety dates across month/leap boundaries without guessing stage or yield',t=>{
 t.mock.timers.enable({apis:['Date'],now:Date.parse(now)});
 const result=createFieldSetup(emptyData(),opts,now),estimate=maturityEstimate(result.field,result.cycle);
 assert.equal(result.cycle.status,'active');assert.equal(result.cycle.stage,null);assert.equal(result.cycle.variety,'JS 20-34');assert.equal(estimate.start,'2026-10-04');assert.equal(estimate.end,'2026-10-06');
 assert.equal(maturityEstimate(result.field,{...result.cycle,sowing_date:'2024-01-01',variety:'JS 97-52'}).start,'2024-04-10');
 for(const patch of [{variety:null},{variety:'invented'},{season:null},{season:'Rabi'},{crop:'Wheat'},{sowing_date:null}])assert.equal(maturityEstimate(result.field,{...result.cycle,...patch}),null);
 assert.equal(maturityEstimate({...result.field,region:'Maharashtra'},result.cycle),null);
 const planned=createFieldSetup(emptyData(),{...opts,planted:false,sowing_date:'2027-06-20'},now);assert.equal(planned.cycle.status,'planned');assert.equal(planned.cycle.stage,null);assert.throws(()=>createFieldSetup(emptyData(),{...opts,sowing_date:'2027-06-20'},now));assert.equal(createFieldSetup(emptyData(),{...opts,planted:false},now).cycle.status,'planned');assert.throws(()=>createFieldSetup(emptyData(),{...opts,sowing_date:'2026-02-30'},now));
});
test('month grid is Monday-first and calendar marks bind to the chosen cycle, forecasts do not become irrigation actions',()=>{
 assert.deepEqual(calendarCells('2024-02').slice(0,4),[null,null,null,'2024-02-01']);assert.equal(calendarCells('2024-02').filter(Boolean).length,29);assert.throws(()=>calendarCells('2024-13'));
 const {field,cycle}=createFieldSetup(emptyData(),opts,now),task={cycle_id:cycle.id,title:'Synthetic reminder',status:'pending',schedule:{kind:'date',date:'2026-10-09'}};
 const marks=seasonMarks(field,cycle,[task,{...task,cycle_id:'foreign'}],{days:[{date:'2026-10-09',precipitation:0}]});
 assert.equal(marks.filter(m=>m.kind==='reminder').length,1);assert.equal(marks.filter(m=>m.kind==='maturity').length,3);assert.equal(marks.find(m=>m.kind==='rain').label,'Forecast rain: 0 mm (UTC day)');assert.ok(!marks.some(m=>/irrigat/i.test(m.label)));
});

test('one-use dashboard transfer preserves source time and strips coordinates; expiry, foreign cycles and blocked storage fail safely',async()=>{
 const {prepareDashboardContext,consumeDashboardContext,validateDashboardContext}=await import('../lib/providers/dashboard-context.ts');
 const at=Date.parse('2026-10-09T05:00:00.000Z'),store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 const weather={schema_version:'weather-1',fetched_at:new Date(at).toISOString(),observed_at:'2026-10-09T05:00:00.000Z',issued_at:null,interval_seconds:900,timezone:'GMT',current:{temperature:20,humidity:50,precipitation:0,wind:2},days:Array.from({length:7},(_,i)=>({date:`2026-10-${String(9+i).padStart(2,'0')}`,minimum:15,maximum:25,precipitation:0})),coordinates:{latitude:23,longitude:77}};
 const soil={kind:'soil_map',soil_class:'Vertisols',source:'https://maps.isric.org/',reference_year:null,fetched_at:weather.fetched_at,coordinates:{latitude:23,longitude:77}};
 prepareDashboardContext(storage,'field','cycle',weather,soil,at);assert.ok(![...store.values()][0].includes('coordinates'));
 const ctx=consumeDashboardContext(storage,'field','cycle',at+60000);assert.equal(ctx.weather.fetched_at,weather.fetched_at);assert.equal(ctx.soil.soil_class,'Vertisols');assert.equal(store.size,0);assert.equal(consumeDashboardContext(storage,'field','cycle',at+60000),null);
 assert.throws(()=>validateDashboardContext(ctx,'other','cycle',at+60000));assert.throws(()=>validateDashboardContext(ctx,'field','cycle',at+1800000));assert.throws(()=>validateDashboardContext({...ctx,weather:{...ctx.weather,current:{...ctx.weather.current,humidity:200}}},'field','cycle',at));
 prepareDashboardContext(storage,'field','cycle',weather,soil,at);prepareDashboardContext(storage,'field','cycle',null,null,at);assert.equal(store.size,0);
 const blocked={getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');},removeItem:()=>{throw Error('blocked');}};assert.doesNotThrow(()=>prepareDashboardContext(blocked,'field','cycle',weather,soil,at));assert.equal(consumeDashboardContext(blocked,'field','cycle',at),null);
});
