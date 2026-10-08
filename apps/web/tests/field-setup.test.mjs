import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, makeBackup, validateData } from '../lib/domain/farm.ts';
import { createFieldSetup } from '../lib/domain/field-setup.ts';
import { validMapPoint, parseMappedSoil, lookupMappedSoil } from '../lib/providers/field-context.ts';
const now='2026-10-08T18:00:00.000Z';
const location={latitude:23,longitude:77,accuracy_m:null,method:'manual',confirmed_at:now};
const options=()=>({name:'Synthetic setup fixture',district:'Sehore',coordinates:location,remember:false,crop:'soybean',season:'Kharif',water:'rainfed'});
test('setup creates an atomic valid field/cycle without retaining coordinates by default or inventing soil/stage',()=>{
  const data=emptyData(),before=structuredClone(data),result=createFieldSetup(data,options(),now);
  assert.deepEqual(data,before);assert.deepEqual(validateData(result.data),result.data);assert.equal(result.field.location,null);assert.equal(result.field.region,'Sehore, Madhya Pradesh');assert.equal(result.cycle.crop,'Soybean');assert.equal(result.cycle.field_id,result.field.id);assert.equal(result.cycle.sowing_date,null);assert.equal(result.cycle.stage,null);assert.deepEqual(result.data.soil_tests,[]);assert.deepEqual(result.data.scans,[]);
});
test('remembering is explicit, coordinate-free backups remain default, and location skip stays unknown',()=>{
  const saved=createFieldSetup(emptyData(),{...options(),remember:true},now);
  assert.deepEqual(saved.field.location,location);assert.equal(makeBackup(saved.data).data.fields[0].location,null);
  const skipped=createFieldSetup(emptyData(),{...options(),coordinates:null,district:'',season:'',water:'unknown'},now);
  assert.equal(skipped.field.location,null);assert.equal(skipped.field.region,'Madhya Pradesh');assert.equal(skipped.cycle.season,null);assert.equal(skipped.field.water,'unknown');
});
test('all requested crops save while unsupported crops and blank names reject without modifying records',()=>{
  for(const crop of ['soybean','wheat','chickpea'])assert.ok(createFieldSetup(emptyData(),{...options(),crop},now).cycle.crop);
  for(const patch of [{crop:'tomato'},{name:' '},{crop:'constructor'}])assert.throws(()=>createFieldSetup(emptyData(),{...options(),...patch},now));
  const existing=createFieldSetup(emptyData(),options(),now).data;const another=createFieldSetup(existing,{...options(),crop:'wheat'},now);assert.deepEqual(another.data.fields[0],existing.fields[0]);assert.equal(another.data.fields.length,2);
});
test('map extent rejects absent/invalid/out-of-view coordinates without claiming state boundaries',()=>{
  assert.equal(validMapPoint(location),true);
  for(const point of [{latitude:NaN,longitude:77},{latitude:0,longitude:0},{latitude:23,longitude:Infinity},{latitude:50,longitude:77}])assert.equal(validMapPoint(point),false);
});
test('mapped soil response preserves class/provenance, omits geometry and never implies field measurements',()=>{
  const raw={type:'FeatureCollection',features:[{id:'MostProbable',geometry:{coordinates:[77,23]},properties:{pixel_value:'Vertisols',unit:'class'}}]};
  const result=parseMappedSoil(raw,Date.parse(now));assert.equal(result.kind,'soil_map');assert.equal(result.soil_class,'Vertisols');assert.equal(result.reference_year,null);assert.equal(result.fetched_at,now);assert.ok(!JSON.stringify(result).includes('coordinates'));
  for(const patch of [null,{type:'FeatureCollection',features:[]},{type:'FeatureCollection',features:[{id:'MostProbable',properties:{pixel_value:30,unit:'class'}}]},{type:'FeatureCollection',features:[{id:'MostProbable',properties:{pixel_value:'Invented black soil',unit:'class'}}]}])assert.throws(()=>parseMappedSoil(patch,Date.parse(now)));
});
test('soil lookup uses fixed verified WMS layer, signal and bounded request; failure remains unavailable',async()=>{
  const signal=new AbortController().signal;let called=false;
  const soil=await lookupMappedSoil(location,signal,async(url,options)=>{called=true;assert.equal(url.origin,'https://maps.isric.org');assert.equal(url.searchParams.get('QUERY_LAYERS'),'MostProbable');assert.equal(url.searchParams.get('INFO_FORMAT'),'application/geo+json');assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');assert.ok(options.signal);return Response.json({type:'FeatureCollection',features:[{id:'MostProbable',properties:{pixel_value:'Vertisols',unit:'class'}}]});},()=>Date.parse(now));assert.equal(called,true);assert.equal(soil.soil_class,'Vertisols');
  await assert.rejects(lookupMappedSoil(location,signal,async()=>new Response('Unavailable',{status:503})),/unavailable/);
  let transmitted=false;await assert.rejects(lookupMappedSoil({latitude:0,longitude:0},signal,async()=>{transmitted=true;}));assert.equal(transmitted,false);
});
