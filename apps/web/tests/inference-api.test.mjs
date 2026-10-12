import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePrediction } from '../lib/inference/contract.ts';
import { runApiInference } from '../lib/inference/api.ts';
import { proxyPrediction } from '../lib/inference/proxy.ts';
import { modelReadiness } from '../lib/inference/readiness.ts';
const prediction=()=>({model_version:'synthetic-test-model',crop:'Tomato',condition:'Synthetic test condition',confidence:0.6,uncertainty_threshold:0.7,uncertain:true});
function upload(content='synthetic',type='image/png') {const body=new FormData();body.append('image',new File([content],'private-original-name.png',{type}));return new Request('http://localhost/api/predict',{method:'POST',body});}
test('only complete consistent results for the selected supported crop pass; no fallback result exists',()=>{
  assert.equal(parsePrediction(prediction(),'Tomato').mode,'onnx');
  for(const patch of [{confidence:NaN},{confidence:1.2},{uncertain:false},{model_version:''},{uncertainty_threshold:-1},{crop:'Unsupported'},{crop:'Wheat'},{crop:'Peppermint'},{condition:null}])assert.throws(()=>parsePrediction({...prediction(),...patch},'Tomato'));
  assert.throws(()=>parsePrediction(prediction(),'Potato'));assert.throws(()=>parsePrediction('<html>error</html>','Tomato'));
});
test('client sends only the chosen image with a neutral filename and abort signal; errors are sanitized',async()=>{
  const file=new File(['synthetic'],'private-name.png',{type:'image/png'}),controller=new AbortController();let called=false;
  const result=await runApiInference(file,'Tomato',controller.signal,async(url,options)=>{assert.equal(options.cache,'no-store');if(url==='/api/model-status'){assert.equal(options.body,undefined);assert.ok(options.signal);return Response.json({status:'ready'});}called=true;assert.equal(url,'/api/predict');assert.equal(options.body.get('image').name,'leaf-image');assert.equal(options.signal,controller.signal);return Response.json(prediction());});assert.equal(called,true);assert.equal(result.confidence,0.6);
  await assert.rejects(runApiInference(file,'Tomato',controller.signal,async url=>url==='/api/model-status'?Response.json({status:'ready'}):Response.json({detail:'private upstream path'},{status:503})),/unavailable/);
  await assert.rejects(runApiInference(file,'Tomato',controller.signal,async()=>{throw Error('private network detail');}),/has not become ready/);
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
test('readiness checks only configured backend health, strips backend details, and refuses malformed/unready responses',async()=>{
  const request=new Request('https://app.example/api/model-status');
  const ready=await modelReadiness(request,'https://model.example',async(url,options)=>{assert.equal(String(url),'https://model.example/health/ready');assert.equal(options.body,undefined);assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');return Response.json({status:'ready',private_path:'secret'});});
  assert.equal(ready.status,200);assert.deepEqual(await ready.json(),{status:'ready'});assert.equal(ready.headers.get('cache-control'),'no-store');
  for(const http of [async()=>Response.json({status:'not-ready'}),async()=>Response.json({private_path:'secret'},{status:503}),async()=>new Response('<html>secret</html>'),async()=>{throw Error('secret');}]){const response=await modelReadiness(request,'https://model.example',http);assert.equal(response.status,503);assert.deepEqual(await response.json(),{status:'unavailable'});}
  for(const endpoint of [undefined,'http://remote.invalid','https://user:pass@model.example','https://model.example?key=secret'])assert.equal((await modelReadiness(request,endpoint,async()=>{throw Error('must not request');})).status,503);
});
test('readiness failure/cancellation sends no image; progress distinguishes startup from actual upload',async()=>{
  const file=new File(['synthetic'],'private.png',{type:'image/png'}),controller=new AbortController();let calls=0;
  await assert.rejects(runApiInference(file,'Tomato',controller.signal,async(url,options)=>{calls++;assert.equal(url,'/api/model-status');assert.equal(options.body,undefined);return Response.json({status:'unavailable'},{status:503});}),/image was not sent/);assert.equal(calls,1);
  await assert.rejects(runApiInference(file,'Tomato',controller.signal,async()=>{controller.abort();return Response.json({status:'ready'});}),/stopped/);
  await assert.rejects(runApiInference(file,'Tomato',controller.signal,async()=>{throw Error('must not call');}),/stopped/);
  const messages=[],fresh=new AbortController();await runApiInference(file,'Tomato',fresh.signal,async url=>url==='/api/model-status'?Response.json({status:'ready'}):Response.json(prediction()),message=>messages.push(message));assert.equal(messages.length,2);assert.match(messages[0],/not been sent/);assert.equal(messages[1],'Analyzing leaf…');
});
