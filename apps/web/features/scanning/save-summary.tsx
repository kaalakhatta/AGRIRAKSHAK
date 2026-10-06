"use client";
import { useEffect, useRef, useState } from "react";
import type { ScreeningResult } from "@/lib/inference/types";
import { loadFarm, saveFarm } from "@/lib/storage/farm-store";
import { newMeta, type Snapshot } from "@/lib/domain/farm";
import { summaryFromDemo } from "@/lib/domain/scans";
export function SaveSummary({ result, screenedAt }: { result: ScreeningResult; screenedAt: string }) {
  const [snapshot,setSnapshot] = useState<Snapshot | null>(null), [cycle,setCycle] = useState(""), [error,setError] = useState("");
  const [saved,setSaved] = useState(false), [busy,setBusy] = useState(false); const operation = useRef(false);
  useEffect(()=>{let active=true;loadFarm().then(s=>{if(active)setSnapshot(s);}).catch(e=>{if(active)setError(e instanceof Error ? e.message : "Storage unavailable.");});return()=>{active=false;};},[]);
  async function save() {
    if (!snapshot || !cycle || operation.current || saved) return;
    operation.current=true;setBusy(true);setError("");
    try {const summary=summaryFromDemo(result,newMeta(),cycle==="unlinked" ? null : cycle,screenedAt);await saveFarm({...snapshot,scans:[...snapshot.scans,summary]},snapshot.revision);setSaved(true);}
    catch(e){setError(e instanceof Error ? e.message : "Summary could not be saved.");}
    finally {operation.current=false;setBusy(false);}
  }
  return <div className="summary-save farm-workspace"><h4>Keep a screening record</h4><p>Save a labelled demonstration summary on this device. The photo, filename, location and simulated confidence are excluded. It will not count as a diagnosis or farming recommendation.</p><label>Link summary to<select disabled={busy || saved || !snapshot} value={cycle} onChange={e=>setCycle(e.target.value)}><option value="">Choose a cycle or leave unlinked</option><option value="unlinked">Unlinked demonstration</option>{snapshot?.cycles.map(c=><option key={c.id} value={c.id}>{snapshot.fields.find(f=>f.id===c.field_id)?.name} · {c.crop} · {c.status}</option>)}</select></label><button disabled={busy || saved || !cycle || !snapshot} className="button button-secondary" type="button" onClick={()=>void save()}>{saved ? "Summary saved" : busy ? "Saving…" : "Save demonstration summary"}</button><div aria-live="polite">{saved && <p>Saved locally. <a href="/records">Open screening timeline →</a></p>}{error && <p role="alert">{error} Reload the page before retrying a stale-record conflict.</p>}</div></div>;
}
