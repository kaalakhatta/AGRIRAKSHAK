"use client";
import { useEffect, useState } from 'react';
import { prepareDashboardContext } from '@/lib/providers/dashboard-context';
import { DocumentLink } from '@/components/document-link';
import { todayInZone, type Snapshot, type Field, type CropCycle } from '@/lib/domain/farm';
import { recommendNextSteps } from '@/lib/recommendations/next-steps';
import { type MapPoint, type MappedSoil } from '@/lib/providers/field-context';
import { type Weather } from '@/lib/providers/weather';
import { MarketPriceCard } from './market-price-card';
import { SeasonCalendar } from './season-calendar';
import { CropNotes } from './crop-notes';
import { FieldEnvironment } from './field-environment';
export function QuickInfo({snapshot,field,cycle,weather}:{snapshot:Snapshot;field:Field;cycle:CropCycle;weather:Weather|null}) {
  const [open,setOpen]=useState<string|null>(null),[now,setNow]=useState(0);
  useEffect(()=>{const initial=setTimeout(()=>setNow(Date.now()),0),timer=setInterval(()=>setNow(Date.now()),15000);return()=>{clearTimeout(initial);clearInterval(timer);};},[]);
  const steps=recommendNextSteps({field,cycle,tasks:snapshot.tasks,soilTests:snapshot.soil_tests,weather,hasLocation:!!field.location,today:todayInZone('Asia/Kolkata'),now}).filter(s=>!s.id.startsWith('weather')).slice(0,4);
  const selected=steps.find(step=>step.id===open);
  return <div className="quick-info"><span className="eyebrow">Quick info</span><div className="quick-info-buttons">{steps.map(step=><button type="button" className="button quick-info-button" key={step.id} aria-expanded={open===step.id} onClick={()=>setOpen(open===step.id?null:step.id)}>{step.title} <span aria-hidden="true">{open===step.id?'−':'+'}</span></button>)}<DocumentLink href="/farm#manage-fields" className="button quick-info-button">Field & crop details</DocumentLink></div>{selected&&<div className="quick-info-panel"><h3>{selected.title}</h3><p>{selected.why}</p><DocumentLink href={selected.href==='/farm'?'/farm#manage-fields':selected.href}>{selected.action}</DocumentLink></div>}</div>;
}
export function CropDashboard({snapshot,field,cycle,point,weather:initialWeather,soil}:{snapshot:Snapshot;field:Field;cycle:CropCycle;point:MapPoint|null;weather:Weather|null;soil:MappedSoil|null}) {
  const [weather,setWeather]=useState(initialWeather),[mappedSoil,setMappedSoil]=useState(soil);
  function carryContext(){try{prepareDashboardContext(sessionStorage,field.id,cycle.id,weather,mappedSoil,Date.now());}catch{/* Navigation remains available when storage is blocked. */}}
  const target=`/today#field=${encodeURIComponent(field.id)}&cycle=${encodeURIComponent(cycle.id)}`;
  return <div className="crop-dashboard"><div className="dashboard-welcome"><div><span className="status-chip">Saved on this device</span><h2>{cycle.crop}, at a glance.</h2><p>{field.name} · {field.region} · {cycle.season??'Season unknown'}</p><p className="dashboard-caption">{field.location?'Location saved locally; remove it in field settings.':'No precise location saved. Fetched estimates can carry to the next screen; your point stays on this page.'}</p></div><DocumentLink className="button button-primary" href={target} onClick={carryContext}>Open full farm dashboard →</DocumentLink></div><QuickInfo snapshot={snapshot} field={field} cycle={cycle} weather={weather}/><div className="crop-dashboard-grid"><MarketPriceCard crop={cycle.crop} region={field.region}/><CropNotes field={field} cycle={cycle}/></div><FieldEnvironment snapshot={snapshot} field={field} point={point} initialWeather={initialWeather} initialSoil={mappedSoil} onWeather={setWeather} onSoil={setMappedSoil}/><SeasonCalendar field={field} cycle={cycle} tasks={snapshot.tasks} weather={weather}/><div className="dashboard-next"><div><h3>Everything for this field, in one place.</h3><p>Government scheme matches, the profit scenario calculator and your season reminders are on the full farm dashboard.</p></div><DocumentLink className="button button-primary" href={target} onClick={carryContext}>Continue to my farm dashboard →</DocumentLink></div></div>;
}
