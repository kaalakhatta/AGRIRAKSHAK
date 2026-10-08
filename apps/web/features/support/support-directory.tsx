"use client";
import { useState } from 'react';
import { findSupport, type SupportCategory } from '@/lib/content/farmer-support';
import { SavedFieldSchemes } from './scheme-matcher';

const filters = [['all', 'All support'], ['schemes', 'Schemes'], ['loans', 'Loans'], ['insurance', 'Insurance']] as const;
export function SupportDirectory() {
  const [category, setCategory] = useState<SupportCategory | 'all'>('all'), [query, setQuery] = useState('');
  const entries = findSupport(category, query);
  return <section id="schemes" className="hub-section" aria-labelledby="support-title">
    <div className="hub-section-heading"><div><p className="eyebrow">Government support for your farm</p><h2 id="support-title">Find schemes for your field</h2><p>Use your saved Madhya Pradesh field and crop details to find relevant central and state programmes.</p></div><span className="hub-tag">Information snapshot · 9 Oct 2026</span></div>
    <SavedFieldSchemes />
    <details className="scheme-browse"><summary>Browse general programme information & bank products</summary><p>These resources are general information. Bank products are separate from government scheme matches above.</p>
    <div className="support-tools"><div className="hub-filters" role="group" aria-label="Support category">{filters.map(([value, label]) => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{label}</button>)}</div><label className="hub-search">Search support<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try PM-KISAN, soil, solar…" /></label></div>
    <p className="hub-caption" role="status">{entries.length} {entries.length === 1 ? 'resource' : 'resources'} shown. Final eligibility, deadlines and terms are confirmed by the programme office, insurer or bank.</p>
    <div className="support-grid">{entries.map(entry => <article className="support-card" key={entry.id}>
      <div className="support-card-top"><span className="hub-tag">{entry.categories.map(value => filters.find(([key]) => key === value)?.[1]).join(' · ')}</span><span className="hub-source-date">Checked {entry.checked_on}</span></div>
      <h3>{entry.name}</h3><p className="hub-caption">{entry.provider}</p><p>{entry.summary}</p><p className="support-benefit">{entry.benefit}</p>
      <p className="support-availability">{entry.availability}</p>
      <details><summary>Who it covers & what to prepare</summary><h4>Who it covers</h4><p>{entry.audience}</p><h4>Before contacting the office or bank</h4><ul>{entry.prepare.map(item => <li key={item}>{item}</li>)}</ul><p>{entry.caution}</p><a href={entry.source.url} target="_blank" rel="noopener noreferrer">{entry.source.label} ↗</a></details>
      <a className="support-link" href={entry.portal.url} target="_blank" rel="noopener noreferrer">{entry.portal.label} <span aria-hidden="true">↗</span></a>
    </article>)}</div>
    {!entries.length && <div className="hub-empty"><h3>No matching resources</h3><p>Try another term or show all support.</p><button type="button" className="button button-secondary" onClick={() => { setQuery(''); setCategory('all'); }}>Reset filters</button></div>}
    <p className="hub-caption">Read the official page before applying. AgriRakshak does not accept applications, Aadhaar numbers, bank details or KYC documents.</p></details>
  </section>;
}
