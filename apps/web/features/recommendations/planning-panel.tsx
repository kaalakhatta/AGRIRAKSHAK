"use client";
import { useEffect, useState } from "react";
import type { Snapshot } from "@/lib/domain/farm";
import { planGuidance } from "@/lib/recommendations/planning";

export function PlanningPanel({ snapshot, fieldId, cycleId }: { snapshot: Snapshot; fieldId: string; cycleId: string | null }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const initial = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, []);
  const plan = planGuidance(snapshot, fieldId, cycleId, now);
  const blockers = [...new Set(plan.decisions.filter(decision => decision.status !== "matched").flatMap(decision => decision.reasons))];
  return <section className="farm-card" aria-label="Seed comparisons and crop schedules">
    <h2>Plan with reviewed evidence</h2>
    <p>Sehore, Madhya Pradesh · soybean, wheat and gram/chickpea. Comparisons depend on your selected field, crop, season and required inputs.</p>
    <ul>{plan.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
    <h3>Seed comparisons</h3>
    <p>Eligible varieties appear alphabetically with evidence and cautions. No suitability score, yield guarantee or seed-stock claim.</p>
    {!plan.seeds.length && <p>No reviewed seed comparisons are available for this cycle yet.</p>}
    {plan.seeds.map(seed => <article className="field-item" key={seed.id}>
      <h4>{seed.name}</h4>
      <dl>{seed.facts.map(fact => <div key={fact.key}><dt>{fact.label}</dt><dd>{fact.value} {fact.evidence.map(url => <a key={url} href={url} target="_blank" rel="noreferrer">Source</a>)}</dd></div>)}</dl>
      <ul>{[...seed.reasons, ...seed.cautions].map((reason, index) => <li key={index}>{reason}</li>)}</ul>
      <p>Inputs checked: {seed.inputs.join(", ")}. Reviewed by {seed.reviewer} on {seed.reviewed_at.slice(0, 10)}.</p>
    </article>)}
    <h3>Crop-schedule preview</h3>
    <p>Reviewed date windows use your sowing date and farm timezone. Stage guidance uses your recorded stage. This preview does not change your personal reminders.</p>
    {!plan.calendar.length && <p>No reviewed crop schedules are available for this cycle yet.</p>}
    {plan.calendar.map(proposal => <article className="field-item" key={proposal.id}>
      <span className="cycle-badge">{proposal.timing_label}</span><h4>{proposal.title}</h4>
      <p>{proposal.start_date ? `${proposal.start_date} to ${proposal.end_date}` : `Confirmed stage: ${proposal.stage}`}</p>
      <p>{proposal.action}</p>
      <ul>{[...proposal.reasons, ...proposal.cautions].map((reason, index) => <li key={index}>{reason}</li>)}</ul>
      <p>Inputs checked: {proposal.inputs.join(", ")}. Reviewed by {proposal.reviewer} on {proposal.reviewed_at.slice(0, 10)}.</p>
      <ul>{proposal.evidence.map(url => <li key={url}><a href={url} target="_blank" rel="noreferrer">Evidence source</a></li>)}</ul>
    </article>)}
    {!!blockers.length && <details><summary>Checks preventing guidance</summary><ul>{blockers.map(reason => <li key={reason}>{reason}</li>)}</ul></details>}
    <p>Confirm locally with an agricultural expert before using crop or seed guidance.</p>
    <a href="/farm">Review crop, season and field inputs</a>
  </section>;
}
