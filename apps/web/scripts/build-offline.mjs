import { readdir,readFile,mkdir,writeFile,rm } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { workerSource } from '../lib/offline/worker-source.mjs';
export const OFFLINE_ROUTES=['/','/farm','/plan','/today','/records','/scan'];
async function files(directory){const result=[];for(const item of await readdir(directory,{withFileTypes:true})){const name=path.join(directory,item.name);if(item.isDirectory())result.push(...await files(name));else if(item.isFile())result.push(name);}return result.sort();}
export async function buildOffline(webRoot){
  const staticRoot=path.join(webRoot,'.next/static'),assetFiles=(await files(staticRoot)).filter(f=>/\.(js|css|woff2?)$/.test(f));
  if(!assetFiles.length)throw new Error('Build the app before preparing offline assets.');
  const html=await Promise.all(OFFLINE_ROUTES.map(route=>readFile(path.join(webRoot,'.next/server/app',route==='/' ? 'index.html' : route.slice(1)+'.html'))));
  const hash=createHash('sha256');hash.update(await readFile(new URL('../lib/offline/worker-source.mjs',import.meta.url)));for(const file of assetFiles){hash.update(path.relative(staticRoot,file));hash.update(await readFile(file));}html.forEach(content=>hash.update(content));
  const version=hash.digest('hex').slice(0,20),publicRoot=path.join(webRoot,'public'),output=path.join(publicRoot,'offline',version);
  const pack={version,record_schema:8,preparation_version:'preparation-1',model:'Server inference when configured; explicit interface demo available',catalog:'No reviewed entries',assets:assetFiles.map(f=>'/_next/static/'+path.relative(staticRoot,f).split(path.sep).join('/')),pages:OFFLINE_ROUTES.map(route=>({path:route,asset:`/offline/${version}/${route==='/' ? 'index' : route.slice(1)}.html`}))};
  const source=workerSource(pack);
  // This directory contains only ignored generated shell copies, never diaries.
  await rm(path.join(publicRoot,'offline'),{recursive:true,force:true});await mkdir(output,{recursive:true});
  await Promise.all(pack.pages.map((page,i)=>writeFile(path.join(output,path.basename(page.asset)),html[i])));
  await writeFile(path.join(publicRoot,'sw.js'),source);await writeFile(path.join(publicRoot,'offline-release.json'),JSON.stringify(pack,null,2)+'\n');
  return pack;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const pack=await buildOffline(fileURLToPath(new URL('../',import.meta.url)));process.stdout.write(`Offline pack ${pack.version}: ${pack.pages.length} pages, ${pack.assets.length} app assets.\n`);}
