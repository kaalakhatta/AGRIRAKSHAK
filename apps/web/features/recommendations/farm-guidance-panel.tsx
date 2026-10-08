"use client";
import { useEffect, useState } from "react";
import type { Snapshot } from "@/lib/domain/farm";
import { farmGuidance, INITIAL_COVERAGE, type BoundWeather } from "@/lib/recommendations/farm-guidance";

export function FarmGuidancePanel({ snapshot, fieldId, cycleId, weather = null }: { snapshot: Snapshot; fieldId: string; cycleId: string | null; weather?: BoundWeather | null }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const initial = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, []);
  const guidance = farmGuidance(snapshot, fieldId, cycleId, now, weather);
  return <section className="farm-card" aria-label="Agricultural guidance">
    <h3>Agricultural guidance</h3>
    <p>Initial focus: {INITIAL_COVERAGE.label} · soybean, wheat and gram/chickpea.</p>
    <ul>{guidance.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
    {guidance.actions.map(action => <article key={action.id}>
      <h4>{action.title}</h4><p>{action.action}</p>
      <ul>{action.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
      <p>Reviewed by {action.reviewer} · {action.reviewed_at.slice(0, 10)}. Check locally with an agricultural expert.</p>
      <ul>{action.evidence.map(url => <li key={url}><a href={url} target="_blank" rel="noreferrer">Evidence source</a></li>)}</ul>
    </article>)}
    {!guidance.actions.length && <p>Seed comparisons and crop schedules will appear after applicable content is reviewed. Your personal reminders work locally.</p>}
    <a href="/farm">Review field and crop-cycle details</a>
  </section>;
}
