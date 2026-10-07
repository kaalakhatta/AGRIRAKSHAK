import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { validateSale, saleTotals, seasonReview } from '../lib/domain/season-records.ts';
import { emptyData,validateData,makeBackup,parseBackup,planImport,removeCycle,removeField } from '../lib/domain/farm.ts';
import { loadFarm,saveFarm } from '../lib/storage/farm-store.ts';
const meta=id=>({id,schema_version:1,created_at:'2026-10-06T20:00:00.000Z',updated_at:'2026-10-06T20:00:00.000Z',origin:'user'});
const sale=(id='sale')=>({...meta(id),cycle_id:'cycle',date:'2026-10-07',quantity:50,unit:'kg',gross_amount_minor:10001,currency:'INR',note:null});
const cost=(id='cost')=>({...meta(id),cycle_id:'cycle',date:'2026-10-07',category:'Seeds',kind:'cost',amount_minor:12550,currency:'INR',note:null});
const harvest=(id='harvest')=>({...meta(id),cycle_id:'cycle',date:'2026-10-07',quantity:100,unit:'kg',harvested_area:null,note:null});
const data=()=>({...emptyData(),farms:[{...meta('farm'),name:'Test fixture',language:'en',timezone:'Asia/Kolkata'}],fields:[{...meta('field'),farm_id:'farm',name:'Test fixture field',region:null,area:null,water:'unknown',location:null}],cycles:[{...meta('cycle'),field_id:'field',crop:'Test fixture crop',variety:null,status:'active',sowing_date:'2026-10-01',stage:null,stage_recorded_at:null,season:null}],expenses:[cost(),{...cost('refund'),kind:'refund',amount_minor:2530}],harvests:[harvest()],sales:[sale()]});

test('sales validate quantities, received paise and INR; unapproved private fields are stripped',()=>{
 const row=sale();assert.deepEqual(validateSale({...row,buyer_phone:'private',photo:'private',location:{latitude:0},harvested_area:{value:1,unit:'ha'}}),row);
 for(const patch of [{quantity:0},{quantity:1.5,unit:'piece'},{quantity:Number.MAX_VALUE,unit:'t'},{unit:'basket'},{currency:'USD'},{gross_amount_minor:0},{gross_amount_minor:1.5},{gross_amount_minor:Infinity},{date:'2026-02-30'},{note:'x'.repeat(501)}])assert.throws(()=>validateSale({...row,...patch}));
});
test('sales require a cycle, valid local dates and planting; partial harvest diaries do not block sales',()=>{
 const d=data();d.harvests=[];assert.doesNotThrow(()=>validateData(d));
 for(const patch of [{cycle_id:'missing'},{id:'field'},{date:'2099-01-01'},{date:'2026-09-30'}])assert.throws(()=>validateData({...d,sales:[{...sale(),...patch}]}));
 d.cycles[0].status='planned';assert.throws(()=>validateData(d),/planted cycle/);d.cycles[0].status='active';d.farms[0].timezone='America/Los_Angeles';assert.throws(()=>validateData(d),/entry creation/);
});
test('review exact receipts and refunds produces negative/zero recorded balances without changing data',()=>{
 const d=data(),before=JSON.stringify(d),review=seasonReview(d,'cycle');assert.equal(review.sold.received,10001n);assert.equal(review.outlay.net,10020n);assert.equal(review.balance,-19n);assert.equal(review.weightDifference,50);assert.equal(review.pieceDifference,null);assert.ok(review.gaps.some(g=>g.includes('areas')));assert.equal(JSON.stringify(d),before);
 d.sales[0].gross_amount_minor=10020;assert.equal(seasonReview(d,'cycle').balance,0n);
 const huge=saleTotals([{...sale('a'),gross_amount_minor:Number.MAX_SAFE_INTEGER},{...sale('b'),gross_amount_minor:Number.MAX_SAFE_INTEGER},{...sale('foreign'),cycle_id:'other'}],'cycle');assert.equal(huge.received,18014398509481982n);assert.equal(huge.count,2);
});
test('missing costs, refund-only expenses and missing sales never become zero-income profit',()=>{
 const d=data();d.expenses=[d.expenses[1]];let r=seasonReview(d,'cycle');assert.equal(r.hasCosts,false);assert.equal(r.balance,null);assert.ok(r.gaps.some(g=>g.includes('Refunds alone')));
 d.expenses=[cost()];d.sales=[];r=seasonReview(d,'cycle');assert.equal(r.balance,null);assert.ok(r.gaps.some(g=>g.includes('not zero')));d.harvests=[];assert.ok(seasonReview(d,'cycle').gaps.some(g=>g.includes('harvested quantity is unknown')));assert.throws(()=>seasonReview(d,'missing'));
});
test('review separates mass/counts, normalizes weights and reports mismatches without assuming inventory',()=>{
 const d=data();d.harvests=[{...harvest('a'),quantity:100,unit:'g'},{...harvest('b'),quantity:200,unit:'g'},{...harvest('c'),quantity:4,unit:'piece'}];d.sales=[{...sale('a-sale'),quantity:0.3},{...sale('b-sale'),quantity:2,unit:'piece'}];let r=seasonReview(d,'cycle');assert.equal(r.weightDifference,0);assert.equal(r.pieceDifference,2n);assert.ok(!r.gaps.some(g=>g.includes('exceed')));
 d.sales[0].quantity=1;r=seasonReview(d,'cycle');assert.ok(r.weightDifference<0);assert.ok(r.gaps.some(g=>g.includes('exceed')));assert.doesNotThrow(()=>validateData(d));
 d.harvests=[{...harvest(),unit:'piece',quantity:4}];d.sales=[sale()];r=seasonReview(d,'cycle');assert.equal(r.weightDifference,null);assert.equal(r.pieceDifference,null);
});
test('unrepresentable aggregate weight stays unavailable while money and counts remain exact',()=>{
 const d=data();d.harvests=[{...harvest('a'),quantity:Number.MAX_VALUE},{...harvest('b'),quantity:Number.MAX_VALUE}];const r=seasonReview(d,'cycle');assert.equal(r.harvest.mass_kg,null);assert.equal(r.weightDifference,null);assert.ok(r.gaps.some(g=>g.includes('numeric range')));assert.equal(r.sold.received,10001n);
});
test('review isolates cycles and synthetic rows, including rows under demo parents',()=>{
 const d=data();d.cycles.push({...d.cycles[0],id:'other'});d.sales.push({...sale('other-sale'),cycle_id:'other',gross_amount_minor:999999},{...sale('demo-sale'),origin:'demo',gross_amount_minor:5});assert.equal(seasonReview(d,'cycle').sold.received,10001n);assert.equal(seasonReview(d,'cycle',true).sold.received,5n);
 for(const key of ['farms','fields','cycles']){const copy=structuredClone(d);copy[key][0].origin='demo';assert.equal(seasonReview(copy,'cycle').entryCount,0);assert.equal(seasonReview(copy,'cycle',true).sold.received,10006n);}
});
test('v5 imports preserve diaries with empty sales; hidden arrays, future versions and mismatched envelopes reject',()=>{
 const d=data();d.schema_version=5;delete d.sales;const b={schema_version:5,application_version:'farm-m4-v5',exported_at:meta('x').created_at,includes_coordinates:false,data:d};const migrated=parseBackup(JSON.stringify(b));assert.equal(migrated.schema_version,6);assert.deepEqual(migrated.data.sales,[]);assert.deepEqual(migrated.data.harvests,d.harvests);assert.deepEqual(migrated.data.expenses,d.expenses);
 assert.throws(()=>validateData({...d,sales:[]}));assert.throws(()=>validateData({...data(),schema_version:7}));assert.throws(()=>parseBackup(JSON.stringify({...b,data:data()})));assert.throws(()=>validateData({...data(),sales:undefined}));assert.throws(()=>validateData({...data(),sales:Array.from({length:1001},(_,i)=>sale(String(i)))}));
});
test('sales participate in private backup, idempotent/conflicting import and cycle/field cascades',()=>{
 const d=data();d.fields[0].location={latitude:0,longitude:0,accuracy_m:null,method:'manual',confirmed_at:meta('x').created_at};const b=makeBackup(d);assert.equal(b.data.fields[0].location,null);assert.deepEqual(parseBackup(JSON.stringify(b)).data.sales,d.sales);assert.equal(planImport(d,structuredClone(d)).additions,0);
 const other=structuredClone(d);other.sales[0].gross_amount_minor=22222;assert.equal(planImport(d,other).conflicts.length,1);assert.equal(planImport(d,other).merged.sales[0].gross_amount_minor,10001);assert.equal(planImport(d,other,'backup').merged.sales[0].gross_amount_minor,22222);
 d.cycles.push({...d.cycles[0],id:'other'});d.sales.push({...sale('other-sale'),cycle_id:'other'});assert.deepEqual(removeCycle(d,'cycle').sales.map(s=>s.id),['other-sale']);assert.deepEqual(removeField(d,'field').sales,[]);assert.equal(d.sales.length,2);
});
test('stored v5 migration preserves existing entries, commits sales atomically and rejects stale/invalid writes',async()=>{
 globalThis.indexedDB=new IDBFactory();const d=data(),old={...d,schema_version:5,revision:2};delete old.sales;
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('agrirakshak-farm',1);r.onupgradeneeded=()=>r.result.createObjectStore('snapshots');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await new Promise((resolve,reject)=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').put(old,'current');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
 const before=await loadFarm();assert.equal(before.schema_version,6);assert.deepEqual(before.sales,[]);assert.deepEqual(before.harvests,d.harvests);const saved=await saveFarm({...before,sales:d.sales},2);assert.deepEqual(await loadFarm(),saved);await assert.rejects(saveFarm({...before,sales:[]},2),/another tab/);await assert.rejects(saveFarm({...saved,sales:[{...sale(),currency:'USD'}]},3));assert.deepEqual(await loadFarm(),saved);
});
