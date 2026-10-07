"use client";
import { useState } from 'react';
import { SeasonLedger } from '@/features/season/season-ledger';
import { SoilNotebook } from './soil-notebook';
import { ScanTimeline } from '@/features/scanning/scan-timeline';
export function RecordsWorkspace() {
  const [section,setSection] = useState<'soil'|'screenings'|'expenses'|'harvests'>('soil');
  return <><div className="farm-workspace"><h1>Your farm records.</h1><div className="button-row" aria-label="Record type"><button className="button button-secondary" aria-pressed={section === 'soil'} type="button" onClick={()=>setSection('soil')}>Soil tests</button><button className="button button-secondary" aria-pressed={section === 'expenses'} type="button" onClick={()=>setSection('expenses')}>Expenses</button><button className="button button-secondary" aria-pressed={section === 'harvests'} type="button" onClick={()=>setSection('harvests')}>Harvests</button><button className="button button-secondary" aria-pressed={section === 'screenings'} type="button" onClick={()=>setSection('screenings')}>Screening timeline</button></div><p>Export or import all records in <a href="/farm">My Farm</a>.</p></div>{section === 'soil' ? <SoilNotebook /> : section === 'screenings' ? <ScanTimeline /> : <SeasonLedger key={section} mode={section} />}</>;
}
