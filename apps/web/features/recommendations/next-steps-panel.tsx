"use client";
import { useState } from 'react';
import { GOALS, type Goal, type NextStep } from '@/lib/recommendations/next-steps';
export function NextStepsPanel({steps, demo}: {steps: NextStep[]; demo: boolean}) {
  const [goal,setGoal] = useState<Goal>('All next steps');
  const visible = steps.filter(s=>goal === 'All next steps' || s.goal === goal);
  return <section aria-labelledby="recommendations-title" className="location-box">
    <p className="eyebrow">Personalized from your records</p><h3 id="recommendations-title">Recommended next steps</h3>
    <p>{demo ? 'Synthetic demo · ' : ''}Planning and record suggestions for this field. These are preparation steps, not prescriptions or yield predictions.</p>
    <label>Your focus<select value={goal} onChange={e=>setGoal(e.target.value as Goal)}>{GOALS.map(g=><option key={g}>{g}</option>)}</select></label>
    <p aria-live="polite">{visible.length} next {visible.length === 1 ? 'step' : 'steps'} for this focus</p>
    {visible.map(s=><article key={s.id} className="farm-card"><p className="eyebrow">{s.goal} · {s.timing}</p><h4>{s.title}</h4><p>{s.why}</p><details><summary>Why am I seeing this?</summary><ul>{s.inputs.map(i=><li key={i}>{i}</li>)}</ul><p>Source: your local field/cycle records{ s.id.startsWith('weather') ? ' and the weather availability shown above' : ''}. No agronomic rule is applied.</p></details><p><a href={s.href}>{s.action} →</a></p></article>)}
    {!visible.length && <p>No preparation gaps or due personal reminders for this focus.</p>}
    <details><summary>Unlock seed, soil and irrigation guidance</summary><p>Regional seed comparisons and farming actions need source-backed content reviewed by an agricultural expert. No reviewed catalog is loaded yet. Soil tests and live sensors are unavailable; GPS cannot measure soil nutrients. Complete records help check eligibility when reviewed guidance arrives.</p></details>
  </section>;
}
