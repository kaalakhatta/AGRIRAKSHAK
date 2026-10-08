import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { mkdtemp,mkdir,writeFile,readFile,rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { workerSource,SHELL_PREFIX } from '../lib/offline/worker-source.mjs';
import { buildOffline,OFFLINE_ROUTES } from '../scripts/build-offline.mjs';
const ORIGIN='https://offline.example';
const pack=version=>({version,assets:['/_next/static/app.js','/_next/static/app.css'],pages:OFFLINE_ROUTES.map(p=>({path:p,asset:`/offline/${version}/${p==='/' ? 'index' : p.slice(1)}.html`}))});
function harness(manifest=pack('aaaaaaaaaaaaaaaaaaaa'),shared=new Map()){
 const handlers={},state={fail:false,requests:[],clients:[{id:'one',url:ORIGIN+'/farm'}],skipped:0,claimed:0};
 const key=input=>typeof input==='string' ? new URL(input,ORIGIN).href : input.url;
 const network=async request=>{state.requests.push(key(request));if(state.fail)throw new Error('Synthetic network unavailable');return new Response('fixture:'+key(request),{status:200,headers:{'content-type':key(request).endsWith('.html') ? 'text/html' : 'application/javascript'}});};
 const caches={async open(name){if(!shared.has(name))shared.set(name,new Map());const entries=shared.get(name);return {async addAll(requests){const responses=await Promise.all(requests.map(async r=>{const response=await network(r);if(!response.ok)throw new Error('Bad response');return [key(r),response];}));responses.forEach(([url,response])=>entries.set(url,response));},async match(r){return entries.get(key(r))?.clone();}};},async keys(){return [...shared.keys()];},async delete(name){return shared.delete(name);}};
 const scope={location:{origin:ORIGIN},caches,Request,AbortController,setTimeout,clearTimeout,fetch:network,clients:{matchAll:async()=>state.clients,claim:async()=>{state.claimed++;}},skipWaiting:async()=>{state.skipped++;},addEventListener(name,handler){handlers[name]=handler;}};
 Object.defineProperty(scope,'indexedDB',{get(){throw new Error('Worker must not touch farmer records');}});
 vm.runInNewContext(workerSource(manifest),{self:scope,URL,Map,Set,Promise,Boolean});
 const lifecycle=async name=>{let pending;handlers[name]({waitUntil:p=>{pending=p;}});await pending;};
 const fetchRequest=async(url,options={})=>{let response;handlers.fetch({request:{url:new URL(url,ORIGIN).href,method:options.method ?? 'GET',mode:options.mode ?? 'navigate'},respondWith:p=>{response=p;}});return response ? {handled:true,response:await response} : {handled:false};};
 const message=async(kind,source=ORIGIN+'/farm')=>{let pending,reply;handlers.message({source:{url:source},ports:[{postMessage:r=>{reply=r;}}],data:{kind},waitUntil:p=>{pending=p;}});await pending;return reply;};
 return {state,shared,lifecycle,fetchRequest,message,manifest};
}
test('complete shell loads every route and asset with the network unavailable, without farmer-database access',async()=>{
 const h=harness();await h.lifecycle('install');await h.lifecycle('activate');h.state.fail=true;h.state.requests=[];
 for(const route of OFFLINE_ROUTES){const result=await h.fetchRequest(route);assert.equal(result.handled,true);assert.match(await result.response.text(),/offline\/aaaaaaaa/);}
 assert.equal((await h.fetchRequest('/_next/static/app.js',{mode:'cors'})).handled,true);assert.equal(h.state.requests.length,0);assert.equal((await h.message('AGRIRAKSHAK_STATUS')).ready,true);assert.equal(h.state.claimed,1);assert.equal(h.state.skipped,0);
});
test('weather, query strings, RSC, POST, models, photos and unknown routes are never intercepted or cached',async()=>{
 const h=harness();await h.lifecycle('install');const before=[...h.shared.get(SHELL_PREFIX+h.manifest.version).keys()];
 for(const [url,options] of [['https://weather.example/?latitude=0',{}],['/farm?latitude=0',{}],['/records?_rsc=private',{mode:'cors'}],['/farm',{method:'POST'}],['/models/private.onnx',{mode:'cors'}],['/photo.jpg',{mode:'cors'}],['/api/telemetry',{}],['/unknown',{}]])assert.equal((await h.fetchRequest(url,options)).handled,false);
 assert.deepEqual([...h.shared.get(SHELL_PREFIX+h.manifest.version).keys()],before);
});
test('failed new pack installation removes only its incomplete cache and preserves the previous usable pack',async()=>{
 const shared=new Map(),old=harness(pack('aaaaaaaaaaaaaaaaaaaa'),shared);await old.lifecycle('install');const newer=harness(pack('bbbbbbbbbbbbbbbbbbbb'),shared);newer.state.fail=true;await assert.rejects(newer.lifecycle('install'));assert.equal(shared.has(SHELL_PREFIX+'bbbbbbbbbbbbbbbbbbbb'),false);old.state.fail=true;assert.equal((await old.fetchRequest('/records')).handled,true);
});
test('updates require a complete pack and a single app tab; install never forces activation',async()=>{
 const h=harness();await h.lifecycle('install');assert.equal(h.state.skipped,0);h.state.clients.push({id:'two',url:ORIGIN+'/records'});assert.match((await h.message('AGRIRAKSHAK_APPLY_UPDATE')).error,/other tabs/);assert.equal(h.state.skipped,0);h.state.clients.pop();assert.equal((await h.message('AGRIRAKSHAK_APPLY_UPDATE')).accepted,true);assert.equal(h.state.skipped,1);
 const incomplete=harness();assert.match((await incomplete.message('AGRIRAKSHAK_APPLY_UPDATE')).error,/incomplete/);assert.equal(incomplete.state.skipped,0);
});
test('activation keeps the previous pack and unrelated caches; open tabs prevent older-pack cleanup',async()=>{
 const shared=new Map();shared.set('another-app-cache',new Map());for(const v of ['11111111111111111111','22222222222222222222','33333333333333333333']){const h=harness(pack(v),shared);await h.lifecycle('install');}const active=harness(pack('33333333333333333333'),shared);await active.lifecycle('activate');assert.equal(shared.has(SHELL_PREFIX+'11111111111111111111'),false);assert.equal(shared.has(SHELL_PREFIX+'22222222222222222222'),true);assert.equal(shared.has('another-app-cache'),true);
 const next=harness(pack('44444444444444444444'),shared);await next.lifecycle('install');next.state.clients.push({id:'other',url:ORIGIN+'/today'});await next.lifecycle('activate');assert.equal(shared.has(SHELL_PREFIX+'22222222222222222222'),true);
});
test('a previous pack serves its old immutable chunks after activation of a new build',async()=>{
 const shared=new Map(),old=harness({...pack('aaaaaaaaaaaaaaaaaaaa'),assets:['/_next/static/old.js']},shared);await old.lifecycle('install');const newer=harness({...pack('bbbbbbbbbbbbbbbbbbbb'),assets:['/_next/static/new.js']},shared);await newer.lifecycle('install');await newer.lifecycle('activate');newer.state.fail=true;assert.match(await (await newer.fetchRequest('/_next/static/old.js',{mode:'cors'})).response.text(),/old.js/);
});
test('cache readiness detects eviction; failed repair preserves other entries and successful repair restores the pack',async()=>{
 const h=harness();await h.lifecycle('install');h.shared.get(SHELL_PREFIX+h.manifest.version).delete(ORIGIN+h.manifest.pages[1].asset);assert.equal((await h.message('AGRIRAKSHAK_STATUS')).ready,false);h.state.fail=true;assert.ok((await h.message('AGRIRAKSHAK_PREPARE')).error);assert.ok(h.shared.get(SHELL_PREFIX+h.manifest.version).has(ORIGIN+'/_next/static/app.js'));h.state.fail=false;assert.equal((await h.message('AGRIRAKSHAK_PREPARE')).ready,true);
});
test('messages from foreign/unrecognized pages cannot activate or repair a pack',async()=>{
 const h=harness();assert.equal(await h.message('AGRIRAKSHAK_APPLY_UPDATE','https://other.example/farm'),undefined);assert.equal(await h.message('AGRIRAKSHAK_PREPARE',ORIGIN+'/unknown'),undefined);assert.equal(await h.message('AGRIRAKSHAK_PREPARE','invalid'),undefined);assert.equal(h.state.requests.length,0);assert.equal(h.state.skipped,0);
});
test('worker manifests reject private/external assets, duplicate pages, empty packs and unsafe paths',()=>{
 const p=pack('aaaaaaaaaaaaaaaaaaaa');for(const patch of [{version:'unsafe'},{assets:[]},{assets:['https://other.example/app.js']},{assets:['/photo.jpg']},{assets:['/_next/static/a.js?latitude=0']},{assets:['/_next/static/../private.js']},{pages:p.pages.map(()=>p.pages[0])}])assert.throws(()=>workerSource({...p,...patch}));
});
test('build manifest is content-addressed, excludes models/maps and leaves public model artifacts intact',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'agrirakshak-offline-build-'));try{
  await mkdir(path.join(root,'.next/static/chunks'),{recursive:true});await mkdir(path.join(root,'.next/server/app'),{recursive:true});await mkdir(path.join(root,'public/models'),{recursive:true});await writeFile(path.join(root,'public/models/keep.txt'),'fixture only');for(const name of ['app.js','app.css','debug.js.map','model.onnx'])await writeFile(path.join(root,'.next/static/chunks',name),'fixture:'+name);for(const route of OFFLINE_ROUTES)await writeFile(path.join(root,'.next/server/app',route==='/' ? 'index.html' : route.slice(1)+'.html'),'<html>fixture '+route+'</html>');
  const a=await buildOffline(root),b=await buildOffline(root);assert.equal(a.version,b.version);assert.equal(a.assets.length,2);assert.equal(a.pages.length,6);assert.equal(await readFile(path.join(root,'public/models/keep.txt'),'utf8'),'fixture only');assert.match(await readFile(path.join(root,'public/sw.js'),'utf8'),new RegExp(a.version));await writeFile(path.join(root,'.next/static/chunks/app.js'),'changed fixture');assert.notEqual((await buildOffline(root)).version,a.version);
 }finally{await rm(root,{recursive:true,force:true});}
});
