"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useConnectionSignal } from './connectivity';
type PackStatus={version?:string;ready?:boolean;assets?:string[];accepted?:boolean;error?:string};
function ask(worker:ServiceWorker,kind:string):Promise<PackStatus>{
  return new Promise((resolve,reject)=>{const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();reject(new Error('Offline preparation did not respond. Check connection/storage, then retry.'));},20000);channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();const result=e.data as PackStatus;if(result.error)reject(new Error(result.error));else resolve(result);};worker.postMessage({kind},[channel.port2]);});
}
function matchesPage(assets:string[]){return [...document.querySelectorAll<HTMLScriptElement|HTMLLinkElement>('script[src], link[rel="stylesheet"]')].map(e=>new URL('src' in e ? e.src : e.href,location.href)).filter(u=>u.origin===location.origin && u.pathname.startsWith('/_next/static/')).every(u=>assets.includes(u.pathname));}
export function OfflineStatus(){
  const connected=useConnectionSignal(),[phase,setPhase]=useState('checking'),[version,setVersion]=useState(''),[waiting,setWaiting]=useState(false),[reloadNeeded,setReloadNeeded]=useState(false),[confirmed,setConfirmed]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[hasRegistration,setHasRegistration]=useState(false);
  const registration=useRef<ServiceWorkerRegistration|null>(null),reloadRequested=useRef(false),alive=useRef(false),listeners=useRef<Array<()=>void>>([]);
  const inspect=useCallback(async()=>{
    const r=registration.current;if(!r || !alive.current)return;
    setWaiting(!!r.waiting);
    if(r.active){try{const status=await ask(r.active,'AGRIRAKSHAK_STATUS');if(!alive.current)return;if(!status.version || !/^[a-f0-9]{20}$/.test(status.version) || !Array.isArray(status.assets))throw new Error('Offline pack version could not be verified.');setVersion(status.version);setPhase(status.ready ? 'ready' : 'not-ready');setReloadNeeded(!matchesPage(status.assets));setBusy(false);}catch(e){if(alive.current){setError(e instanceof Error ? e.message : 'Offline status unavailable.');setPhase('failed');setBusy(false);}}}
    else if(r.installing){setPhase('preparing');setBusy(true);}
    else {setPhase('not-ready');setBusy(false);}
  },[]);
  const watch=useCallback((r:ServiceWorkerRegistration)=>{
    registration.current=r;setHasRegistration(true);
    const observe=()=>{const worker=r.installing;if(worker){const change=()=>{if(worker.state==='redundant')setError('Offline preparation failed. The previous pack and farm records were not changed. Check connection/storage and retry.');void inspect();};worker.addEventListener('statechange',change);listeners.current.push(()=>worker.removeEventListener('statechange',change));}void inspect();};
    r.addEventListener('updatefound',observe);listeners.current.push(()=>r.removeEventListener('updatefound',observe));observe();
  },[inspect]);
  useEffect(()=>{
    alive.current=true;
    const initialize=setTimeout(()=>{void (async()=>{
      if(process.env.NODE_ENV!=='production'){setPhase('development');return;}
      if(!window.isSecureContext || !('serviceWorker' in navigator)){setPhase('unsupported');return;}
      const r=await navigator.serviceWorker.getRegistration('/');if(!alive.current)return;
      if(r){const owner=r.active ?? r.waiting ?? r.installing;if(owner && new URL(owner.scriptURL).pathname!=='/sw.js'){setPhase('unsupported');setError('Use a dedicated app address: another service worker owns this page.');return;}watch(r);}
      else setPhase('not-ready');
    })().catch(e=>{if(alive.current){setError(e instanceof Error ? e.message : 'Offline setup unavailable.');setPhase('failed');}});},0);
    const changed=()=>{if(reloadRequested.current){window.location.reload();return;}void inspect();};
    if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('controllerchange',changed);
    return()=>{alive.current=false;clearTimeout(initialize);listeners.current.forEach(remove=>remove());listeners.current=[];if('serviceWorker' in navigator)navigator.serviceWorker.removeEventListener('controllerchange',changed);};
  },[watch,inspect]);
  async function prepare(){setBusy(true);setError('');setPhase('preparing');try{
    let r=registration.current;
    if(!r){r=await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});watch(r);}
    else {await r.update();if(r.active && !r.waiting && !r.installing)await ask(r.active,'AGRIRAKSHAK_PREPARE');}
    await inspect();
  }catch(e){setError(e instanceof Error ? e.message : 'Offline preparation failed.');setPhase('failed');setBusy(false);}}
  async function checkUpdate(){setBusy(true);setError('');try{await registration.current?.update();await inspect();}catch(e){setError(e instanceof Error ? e.message : 'Update check failed.');setBusy(false);}}
  async function apply(){if(!confirmed || !registration.current?.waiting)return;setBusy(true);setError('');reloadRequested.current=true;try{const reply=await ask(registration.current.waiting,'AGRIRAKSHAK_APPLY_UPDATE');if(!reply.accepted)throw new Error('Update was not applied.');}catch(e){reloadRequested.current=false;setError(e instanceof Error ? e.message : 'Update failed.');setBusy(false);}}
  const available=!['development','unsupported','checking'].includes(phase);
  return <aside className="offline-bar" aria-label="Offline availability"><p role="status"><strong>{phase==='ready' ? 'Offline app ready' : phase==='preparing' ? 'Preparing offline app…' : phase==='development' ? 'Development preview · offline setup disabled' : phase==='unsupported' ? 'Offline setup unavailable in this browser/address' : phase==='checking' ? 'Checking offline availability…' : 'Offline app not prepared'}</strong>{version && ` · ${version.slice(0,8)}`} · Connection reported {connected ? 'online' : 'offline'}</p><details><summary>Offline & app updates</summary><p>Prepare once while connected to save all six app screens on this device. Farm records stay in their local database; this app cache is not a backup. Weather needs a connection. Model analysis needs a configured server and connection; the explicitly labelled interface demo works locally. Browser data clearing can remove both records and saved app files.</p>{error && <p role="alert" className="form-error">{error}</p>}<div className="button-row">{available && <button className="button button-secondary" type="button" disabled={busy || !connected} onClick={()=>void prepare()}>{busy ? 'Working…' : 'Prepare offline app'}</button>}{hasRegistration && <button className="text-button" type="button" disabled={busy || !connected} onClick={()=>void checkUpdate()}>Check for app update</button>}<a href="/farm">Back up or check a backup file</a></div>{phase==='unsupported' && <p>Use a browser with service workers at an HTTPS address or localhost. Local records can still work without this cache.</p>}{(waiting || reloadNeeded) && <section className="import-preview"><h2>{waiting ? 'App update ready' : 'Reload to use the current app version'}</h2><p>Save your edits and export a backup first. Close other tabs for this app; updates never reload those tabs automatically.</p><label className="check-label"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} />My edits are saved and other app tabs are closed</label><button className="button button-primary" type="button" disabled={!confirmed || busy} onClick={()=>waiting ? void apply() : window.location.reload()}>{waiting ? 'Apply app update and reload' : 'Reload saved app'}</button></section>}</details></aside>;
}
