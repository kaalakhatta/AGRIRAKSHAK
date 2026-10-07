import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { parseRupees,rupeeInput,formatINR,validateExpense,validateHarvest,expenseTotals,harvestTotals,harvestYield,areaHa,formatQuantity } from '../lib/domain/season-records.ts';
import { emptyData,validateData,makeBackup,parseBackup,planImport,removeCycle,removeField } from '../lib/domain/farm.ts';
import { loadFarm,saveFarm } from '../lib/storage/farm-store.ts';
const meta=id=>({id,schema_version:1,created_at:'2026-10-06T20:00:00.000Z',updated_at:'2026-10-06T20:00:00.000Z',origin:'demo'});
const expense=(id='expense')=>({...meta(id),cycle_id:'cycle',date:'2026-10-07',category:'Seeds',kind:'cost',currency:'INR',amount_minor:12345,note:null});
const harvest=(id='harvest')=>({...meta(id),cycle_id:'cycle',date:'2026-10-07',quantity:100,unit:'kg',harvested_area:null,note:null});
const data=()=>({...emptyData(),farms:[{...meta('farm'),name:'Synthetic farm',language:'en',timezone:'Asia/Kolkata'}],fields:[{...meta('field'),farm_id:'farm',name:'Synthetic field',region:null,area:{value:3,unit:'ha'},water:'unknown',location:null}],cycles:[{...meta('cycle'),field_id:'field',crop:'Synthetic crop',variety:null,status:'active',sowing_date:'2026-10-01',stage:null,stage_recorded_at:null,season:null}],expenses:[expense()],harvests:[harvest()]});
test('INR decimal parsing never rounds fractional paise, scientific notation or unsafe amounts',()=>{
 assert.equal(parseRupees('0.10'),10);assert.equal(parseRupees('125.5'),12550);assert.equal(parseRupees('0001.01'),101);assert.equal(parseRupees('90071992547409.91'),Number.MAX_SAFE_INTEGER);assert.equal(rupeeInput(Number.MAX_SAFE_INTEGER),'90071992547409.91');
 for(const raw of ['','0','-1','1e3','1.001','1,000','.5','NaN','Infinity','90071992547409.92'])assert.throws(()=>parseRupees(raw));
 assert.equal(formatINR(10n),'₹0.10');assert.equal(formatINR(-101n),'−₹1.01');
});
test('recorded cost/refund totals remain exact beyond Number sums and isolate cycles',()=>{
 const records=[{...expense('a'),amount_minor:10},{...expense('b'),amount_minor:20},{...expense('c'),kind:'refund',amount_minor:5},{...expense('foreign'),cycle_id:'other',amount_minor:999}];const before=JSON.stringify(records),total=expenseTotals(records,'cycle');assert.equal(total.net,25n);assert.equal(total.refunds,5n);assert.equal(total.count,3);assert.equal(JSON.stringify(records),before);
 const big=expenseTotals([{...expense('x'),amount_minor:Number.MAX_SAFE_INTEGER},{...expense('y'),amount_minor:Number.MAX_SAFE_INTEGER}],'cycle');assert.equal(big.costs,18014398509481982n);
 assert.equal(expenseTotals([{...expense(),kind:'refund'}],'cycle').net,-12345n);
});
test('season validation rejects wrong currencies, fractional paise, unknown categories, dates, units and item fractions',()=>{
 for(const patch of [{currency:'USD'},{amount_minor:0},{amount_minor:1.5},{amount_minor:Infinity},{category:'unknown'},{kind:'profit'},{date:null},{date:'2026-02-30'},{note:'x'.repeat(501)}])assert.throws(()=>validateExpense({...expense(),...patch}));
 for(const patch of [{quantity:0},{quantity:Infinity},{quantity:-1},{unit:'basket'},{unit:'piece',quantity:1.5},{unit:'g',quantity:Number.MIN_VALUE},{unit:'t',quantity:Number.MAX_VALUE},{harvested_area:{value:0,unit:'ha'}},{harvested_area:{value:1,unit:'unknown'}}])assert.throws(()=>validateHarvest({...harvest(),...patch}));
 const e=validateExpense({...expense(),photo:'private',location:{latitude:0},script:'eval()'});assert.ok(!('photo' in e));assert.ok(!('location' in e));assert.ok(!('script' in e));assert.deepEqual(validateHarvest({...harvest(),photo:'private'}),harvest());
});
test('weights normalize across g/kg/tonnes while counts remain separate and absent weights stay missing',()=>{
 const rows=[{...harvest('kg'),quantity:1},{...harvest('g'),quantity:500,unit:'g'},{...harvest('t'),quantity:1,unit:'t'},{...harvest('pieces'),quantity:3,unit:'piece'},{...harvest('foreign'),cycle_id:'other',quantity:9999}];const totals=harvestTotals(rows,'cycle');assert.equal(totals.mass_kg,1001.5);assert.equal(totals.pieces,3n);assert.equal(totals.count,4);assert.equal(harvestTotals([rows[3]],'cycle').mass_kg,null);assert.equal(harvestTotals([],'cycle').mass_kg,null);
 const overflow=harvestTotals([{...harvest('a'),quantity:Number.MAX_VALUE},{...harvest('b'),quantity:Number.MAX_VALUE}],'cycle');assert.equal(overflow.mass_kg,null);assert.notEqual(formatQuantity(1e-9),'0');
});
test('per-entry weight per area uses explicit conversions and never substitutes field area or adds repeated areas',()=>{
 const h=harvest();assert.equal(harvestYield(h),null);assert.equal(areaHa({value:10000,unit:'m2'}),1);assert.ok(Math.abs(areaHa({value:1,unit:'acre'})-0.40468564224)<1e-14);
 h.harvested_area={value:1,unit:'ha'};assert.equal(harvestYield(h),100);h.harvested_area={value:10000,unit:'m2'};assert.equal(harvestYield(h),100);h.harvested_area={value:1,unit:'acre'};assert.ok(Math.abs(harvestYield(h)-247.105381467)<1e-6);h.unit='piece';assert.equal(harvestYield(h),null);
});
test('references, local dates and planting status gate harvests without preventing preplant expenses',()=>{
 const d=data();assert.doesNotThrow(()=>validateData(d));d.farms[0].timezone='America/Los_Angeles';assert.throws(()=>validateData(d),/entry creation/);d.farms[0].timezone='Asia/Kolkata';d.expenses[0].cycle_id='missing';assert.throws(()=>validateData(d),/missing crop cycle/);d.expenses[0]=expense('field');assert.throws(()=>validateData(d),/Duplicate/);d.expenses=[expense()];d.harvests[0].date='2099-01-01';assert.throws(()=>validateData(d),/future/);d.harvests=[harvest()];d.cycles[0].status='planned';assert.throws(()=>validateData(d),/planted cycle/);d.harvests=[];assert.doesNotThrow(()=>validateData(d));d.cycles[0].status='active';d.harvests=[{...harvest(),date:'2026-09-30'}];assert.throws(()=>validateData(d),/sowing date/);
});
test('v1-v4 backups migrate without losing records; future schemas and hidden arrays reject',()=>{
 for(const [version,app] of [[1,'farm-m1-v1'],[2,'farm-m3-v2'],[3,'farm-m3-v3'],[4,'farm-m4-v4']]){
 const d=data();d.schema_version=version;delete d.expenses;delete d.harvests;delete d.sales;delete d.observations;delete d.feedback;if(version<4)delete d.soil_tests;if(version<3)delete d.scans;if(version<2)delete d.tasks;
 const old={schema_version:version,application_version:app,exported_at:meta('x').created_at,includes_coordinates:false,data:d};const upgraded=parseBackup(JSON.stringify(old));assert.equal(upgraded.schema_version,8);assert.deepEqual(upgraded.data.cycles,d.cycles);assert.deepEqual(upgraded.data.expenses,[]);assert.deepEqual(upgraded.data.harvests,[]);assert.throws(()=>validateData({...d,expenses:[expense()]}));assert.throws(()=>validateData({...d,harvests:[harvest()]}));
 }assert.throws(()=>validateData({...data(),schema_version:9}));
});
test('backup imports remain private, idempotent and conflict-aware for both record types',()=>{
 const d=data(),b=makeBackup(d);assert.deepEqual(parseBackup(JSON.stringify(b)).data,d);assert.equal(planImport(d,structuredClone(d)).additions,0);const incoming=structuredClone(d);incoming.expenses[0].amount_minor=100;incoming.harvests[0].quantity=200;
 const pending=planImport(d,incoming);assert.equal(pending.conflicts.length,2);assert.equal(pending.merged.expenses[0].amount_minor,12345);assert.equal(pending.merged.harvests[0].quantity,100);const resolved=planImport(d,incoming,'backup');assert.equal(resolved.merged.expenses[0].amount_minor,100);assert.equal(resolved.merged.harvests[0].quantity,200);
});
test('cycle and field deletion cascade season records while preserving soil and unrelated cycles',()=>{
 const d=data();d.cycles.push({...d.cycles[0],id:'other'});d.expenses.push({...expense('other-e'),cycle_id:'other'});d.harvests.push({...harvest('other-h'),cycle_id:'other'});
 const cycle=removeCycle(d,'cycle');assert.deepEqual(cycle.expenses.map(e=>e.id),['other-e']);assert.deepEqual(cycle.harvests.map(h=>h.id),['other-h']);assert.equal(removeField(d,'field').expenses.length,0);assert.equal(removeField(d,'field').harvests.length,0);assert.equal(d.expenses.length,2);
});
test('legacy stored v4 upgrades atomically, reloads both diaries and preserves data on stale or invalid writes',async()=>{
 globalThis.indexedDB=new IDBFactory();const d=data(),legacy={...d,schema_version:4,revision:2};delete legacy.expenses;delete legacy.harvests;delete legacy.sales;delete legacy.observations;delete legacy.feedback;
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('agrirakshak-farm',1);r.onupgradeneeded=()=>r.result.createObjectStore('snapshots');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await new Promise((resolve,reject)=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').put(legacy,'current');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
 const before=await loadFarm();assert.equal(before.schema_version,8);assert.deepEqual(before.expenses,[]);const saved=await saveFarm({...before,expenses:d.expenses,harvests:d.harvests},2);assert.deepEqual(await loadFarm(),saved);await assert.rejects(saveFarm({...before,expenses:[]},2),/another tab/);assert.deepEqual(await loadFarm(),saved);await assert.rejects(saveFarm({...saved,harvests:[{...harvest(),unit:'basket'}]},3));assert.deepEqual(await loadFarm(),saved);
});
