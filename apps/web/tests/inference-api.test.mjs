import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePrediction } from '../lib/inference/contract.ts';
import { runApiInference } from '../lib/inference/api.ts';
import { proxyPrediction } from '../lib/inference/proxy.ts';
const prediction=()=>({model_version:'synthetic-test-model',crop:'Tomato',condition:'Synthetic test condition',confidence:0.6,uncertainty_threshold:0.7,uncertain:true});
function upload(content='synthetic',type='image/png') {const body=new FormData();body.append('image',new File([content],'private-original-name.png',{type}));return new Request('http://localhost/api/predict',{method:'POST',body});}
test('only complete consistent results for the selected supported crop pass; no fallback result exists',()=>{
  assert.equal(parsePrediction(prediction(),'Tomato').mode,'onnx');
  for(const patch of [{confidence:NaN},{confidence:1.2},{uncertain:false},{model_version:''},{uncertainty_threshold:-1},{crop:'Unsupported'},{crop:'Wheat'},{crop:'Peppermint'},{condition:null}])assert.throws(()=>parsePrediction({...prediction(),...patch},'Tomato'));
  assert.throws(()=>parsePrediction(prediction(),'Potato'));assert.throws(()=>parsePrediction('<html>error</html>','Tomato'));
});
test('client sends only the chosen image with a neutral filename and abort signal; errors are sanitized',async()=>{
  const file=new File(['synthetic'],'private-name.png',{type:'image/png'}),controller=new AbortController();let called=false;
  const result=await runApiInference(file,'Tomato',controller.signal,async(url,options)=>{called=true;assert.equal(url,'/api/predict');assert.equal(options.body.get('image').name,'leaf-image');assert.equal(options.signal,controller.signal);assert.equal(options.cache,'no-store');return Response.json(prediction());});assert.equal(called,true);assert.equal(result.confidence,0.6);
  await assert.rejects(runApiInference(file,'Tomato',controller.signal,async()=>Response.json({detail:'private upstream path'},{status:503})),/unavailable/);
  await assert.rejects(runApiInference(file,'Tomato',controller.signal,async()=>{throw Error('private network detail');}),/could not be reached/);
});
test('proxy missing/invalid endpoint never transmits a photo',async()=>{
  for(const endpoint of [undefined,'not-a-url','http://remote.invalid','https://user:password@example.invalid','https://example.invalid?secret=x']){let called=false;const response=await proxyPrediction(upload(),endpoint,async()=>{called=true;throw Error('must not send');});assert.equal(response.status,503);assert.equal(called,false);}
});
test('proxy bounds and validates uploads, renames file, forwards only to configured server and never caches',async()=>{
  let calls=0;
  const http=async(url,options)=>{calls++;assert.equal(String(url),'https://model.example.invalid/v1/predict');assert.equal(options.body.get('image').name,'leaf-image');assert.equal(options.cache,'no-store');return Response.json(prediction());};
  const good=await proxyPrediction(upload(),'https://model.example.invalid',http);assert.equal(good.status,200);assert.equal(good.headers.get('cache-control'),'no-store');assert.deepEqual(await good.json(),prediction());
  assert.equal((await proxyPrediction(upload('bad','text/plain'),'https://model.example.invalid',http)).status,415);
  assert.equal((await proxyPrediction(upload(''),'https://model.example.invalid',http)).status,413);
  const large=upload();large.headers.set('content-length','999999999');assert.equal((await proxyPrediction(large,'https://model.example.invalid',http)).status,413);
  const stream=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(12*1024*1024));controller.close();}});assert.equal((await proxyPrediction(new Request('http://localhost/',{method:'POST',body:stream,duplex:'half'}),'https://model.example.invalid',http)).status,413);assert.equal(calls,1);
});
test('upstream failures/timeouts/HTML are safe unavailable responses rather than fabricated predictions',async()=>{
  for(const http of [async()=>{throw Error('private network detail');},async()=>new Response('private stack',{status:500}),async()=>new Response('<html>private</html>',{status:200})]){const response=await proxyPrediction(upload(),'http://127.0.0.1:8000',http);assert.equal(response.status,503);assert.ok(!(await response.text()).includes('private'));}
});
