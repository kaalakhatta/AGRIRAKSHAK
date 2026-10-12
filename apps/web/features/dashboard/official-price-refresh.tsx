"use client";
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { MarketCrop, MarketReport } from '@/lib/providers/market-prices';
import type { MarketCaptcha } from '@/lib/providers/official-market';

export function OfficialPriceRefresh({crop,onReport}:{crop:MarketCrop;onReport:(report:MarketReport)=>void}) {
  const [challenge,setChallenge]=useState<MarketCaptcha|null>(null),[answer,setAnswer]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const controller=useRef<AbortController|null>(null);
  useEffect(()=>()=>{controller.current?.abort();},[]);
  function cancel(){controller.current?.abort();setChallenge(null);setAnswer('');setBusy(false);setMessage('Verification cleared.');}
  async function load(){
    controller.current?.abort();const request=new AbortController();controller.current=request;setBusy(true);setChallenge(null);setAnswer('');setMessage('Requesting an Agmarknet verification image…');
    try {
      const response=await fetch('/api/market-captcha',{signal:request.signal,cache:'no-store',credentials:'omit'}),data=await response.json();
      if(!response.ok)throw Error('Verification image unavailable or rate limited. Please try again later.');
      if(typeof data.key!=='string'||typeof data.image!=='string'||!/^data:image\/(png|jpeg);base64,/.test(data.image)||!Number.isFinite(Date.parse(data.expires_at)))throw Error('Unsupported verification image.');
      if(!request.signal.aborted){setChallenge(data);setMessage('Enter the characters yourself to request this month’s official MP prices.');}
    } catch {if(!request.signal.aborted)setMessage('The verification image could not be loaded. Please try again later.');}
    finally {if(!request.signal.aborted)setBusy(false);}
  }
  async function submit(event:React.FormEvent){
    event.preventDefault();if(!challenge||busy)return;
    if(Date.now()>=Date.parse(challenge.expires_at)){setChallenge(null);setAnswer('');setMessage('This CAPTCHA expired. Request a new image.');return;}
    controller.current?.abort();const request=new AbortController();controller.current=request;setBusy(true);setMessage('Checking verification and fetching official prices…');
    try {
      const response=await fetch(`/api/market-prices?crop=${crop}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({captcha_key:challenge.key,captcha:answer}),signal:request.signal,cache:'no-store',credentials:'omit'}),data=await response.json() as MarketReport;
      if(!response.ok)throw Error(response.status===400?'Verification failed or expired. Request a new image and try again.':response.status===429?'Agmarknet is rate limited. Please wait before trying again.':'Official prices could not be fetched. Please try again later.');
      if(data.crop!==crop||data.source!=='https://agmarknet.gov.in/'||data.unit!=='INR/quintal'||!Array.isArray(data.series))throw Error('Unsupported official report.');
      if(!request.signal.aborted){onReport(data);setMessage(data.series.length?'Official prices loaded. Check each report date.':'No reported prices were available for this crop in the current month.');}
    } catch(error){if(!request.signal.aborted)setMessage(error instanceof Error?error.message:'Official prices unavailable.');}
    finally {if(!request.signal.aborted){setChallenge(null);setAnswer('');setBusy(false);}}
  }
  return <div className="dashboard-details"><p>Agmarknet requires human verification for fresh official reports. No account or payment is needed for this request.</p><div className="button-row"><button type="button" className="button button-secondary" onClick={()=>void load()} disabled={busy}>{challenge?'New CAPTCHA':'Fetch fresh official prices'}</button>{(challenge||busy)&&<button type="button" className="text-button" onClick={cancel}>Cancel verification</button>}</div>{challenge&&<form onSubmit={event=>void submit(event)}><Image src={challenge.image} alt="Agmarknet human verification challenge" width={240} height={80} unoptimized/><label>Verification characters<input value={answer} onChange={event=>setAnswer(event.target.value)} autoComplete="off" maxLength={12} required disabled={busy}/></label><button className="button button-primary" disabled={busy||!answer.trim()} type="submit">Verify & fetch official prices</button><p className="dashboard-caption">Expires {new Date(challenge.expires_at).toLocaleTimeString('en-IN')}. Characters are sent only to Agmarknet for verification and are not saved. This fetches current-month history.</p></form>}{message&&<p role="status" className="dashboard-caption">{message}</p>}</div>;
}
