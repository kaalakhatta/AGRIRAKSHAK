"use client";
import { useState } from "react";
import { addExhibitionData } from "@/lib/domain/exhibition";
import { loadFarm, saveFarm } from "@/lib/storage/farm-store";
export function ExhibitionStart() {
  const [busy,setBusy] = useState(false), [message,setMessage] = useState(""), [error,setError] = useState("");
  async function start() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const current = await loadFarm(), data = addExhibitionData(current,new Date().toISOString());
      if (data !== current) await saveFarm(data,current.revision);
      setMessage("Synthetic Sehore sample farm is ready. Open Today or Plan and choose the demo plot and crop cycle.");
    } catch (e) { setError(e instanceof Error ? e.message : "Sample records could not be saved."); }
    finally { setBusy(false); }
  }
  return <section className="farm-card" aria-label="Exhibition sample farm"><h2>Try the Sehore sample farm</h2><p>Three fictional crop cycles—soybean, wheat and gram/chickpea—with a personal reminder, observation and sample season records. Every sample is labelled synthetic. No location, soil reading or model prediction is invented; existing records are preserved.</p><button className="button button-secondary" type="button" disabled={busy} onClick={()=>void start()}>{busy ? "Preparing sample…" : "Add labelled sample farm"}</button><div aria-live="polite">{message && <p className="success-note">{message} <a href="/today">Open Today →</a></p>}{error && <p className="form-error" role="alert">{error}</p>}</div></section>;
}
