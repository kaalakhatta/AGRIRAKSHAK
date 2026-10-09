"use client";
import { useEffect, useState } from 'react';
import { DocumentLink } from '@/components/document-link';
import { todayInZone, type Snapshot, type Field, type CropCycle } from '@/lib/domain/farm';
import { recommendNextSteps } from '@/lib/recommendations/next-steps';
import { type Weather } from '@/lib/providers/weather';
export function QuickInfo({snapshot,field,cycle,weather}:{snapshot:Snapshot;field:Field;cycle:CropCycle;weather:Weather|null}) {
  const [open,setOpen]=useState<string|null>(null),[now,setNow]=useState(0);
  useEffect(()=>{const initial=setTimeout(()=>setNow(Date.now()),0),timer=setInterval(()=>setNow(Date.now()),15000);return()=>{clearTimeout(initial);clearInterval(timer);};},[]);
  const steps=recommendNextSteps({field,cycle,tasks:snapshot.tasks,soilTests:snapshot.soil_tests,weather,hasLocation:!!field.location,today:todayInZone('Asia/Kolkata'),now}).filter(s=>!s.id.startsWith('weather')).slice(0,4);
  const selected=steps.find(step=>step.id===open);
  return <div className="quick-info"><span className="eyebrow">Quick info</span><div className="quick-info-buttons">{steps.map(step=><button type="button" className="button quick-info-button" key={step.id} aria-expanded={open===step.id} onClick={()=>setOpen(open===step.id?null:step.id)}>{step.title} <span aria-hidden="true">{open===step.id?'−':'+'}</span></button>)}<DocumentLink href="/farm#manage-fields" className="button quick-info-button">Field & crop details</DocumentLink></div>{selected&&<div className="quick-info-panel"><h3>{selected.title}</h3><p>{selected.why}</p><DocumentLink href={selected.href==='/farm'?'/farm#manage-fields':selected.href}>{selected.action}</DocumentLink></div>}</div>;
}
