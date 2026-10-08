'use client';
import { useEffect, useState } from 'react';
import { INCOME_CONDITIONS, MP_SCHEME_DIRECTORY, GOVERNMENT_SCHEMES, type AnswerKey } from '@/lib/content/scheme-catalog';
import { fieldState, matchGovernmentSchemes, SCHEME_STATUS, type SchemeAnswers, type SchemeDecision } from '@/lib/domain/scheme-matching';
import { loadFarm } from '@/lib/storage/farm-store';
import type { Field, CropCycle, Snapshot } from '@/lib/domain/farm';

const topics = [['all', 'All relevant schemes'], ['income', 'Income support'], ['credit', 'Credit'], ['insurance', 'Insurance'], ['water', 'Water'], ['soil', 'Soil'], ['seeds', 'Seeds'], ['training', 'Training'], ['infrastructure', 'Infrastructure']] as const;
const yesNo = [['unknown', 'Not sure / skip'], ['yes', 'Yes'], ['no', 'No']] as const;
function DecisionCard({ decision }: { decision: SchemeDecision }) {
  const { scheme, status, reasons, missing, cautions } = decision;
  return <article className="scheme-card"><div className="scheme-card-tags"><span className={`scheme-status scheme-status-${status}`}>{SCHEME_STATUS[status]}</span><span>{scheme.scope === 'mp' ? 'MP programme' : 'Central programme'}</span></div><h3>{scheme.name}</h3><p>{scheme.summary}</p><p className="scheme-benefit">{scheme.benefit}</p>
    <details><summary>Why this appears & next steps</summary><h4>Based on your details</h4><ul>{reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>{missing.length > 0 && <><h4>Still needed</h4><ul>{missing.map(question => <li key={question}>{question}</li>)}</ul></>}<h4>Confirm before applying</h4><ul>{cautions.map(item => <li key={item}>{item}</li>)}</ul><h4>Documents and preparation</h4><ul>{scheme.prepare.map(item => <li key={item}>{item}</li>)}</ul><p>{scheme.caution}</p><p>Source checked {scheme.checked_on}{scheme.source_updated ? ` · detailed source updated ${scheme.source_updated}` : ' · source publication date varies'}. <a href={scheme.source.url} target="_blank" rel="noopener noreferrer">Read official conditions ↗</a></p></details>
    <a className="scheme-official" href={scheme.portal.url} target="_blank" rel="noopener noreferrer">{scheme.portal.label} ↗</a></article>;
}

export function SchemeMatcher({ field, cycle }: { field: Field; cycle: CropCycle | null }) {
  const [answers, setAnswers] = useState<SchemeAnswers>({}), [topic, setTopic] = useState('all'), [query, setQuery] = useState('');
  const [checkedAt] = useState(() => new Date());
  const decisions = matchGovernmentSchemes(field, cycle, answers, checkedAt);
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = decisions.filter(({ scheme }) => (topic === 'all' || scheme.topic === topic) && terms.every(term => `${scheme.name} ${scheme.summary} ${scheme.benefit}`.toLowerCase().includes(term)));
  const order = { potential: 0, verify: 1, needs_info: 2, not_matching: 3 };
  const relevant = filtered.filter(item => item.status !== 'not_matching').sort((a, b) => order[a.status] - order[b.status]);
  const excluded = filtered.filter(item => item.status === 'not_matching');
  function question(key: AnswerKey, label: string, options: readonly (readonly [string, string])[] = yesNo) {
    return <label key={key}>{label}<select value={answers[key] ?? 'unknown'} onChange={event => setAnswers(old => ({ ...old, [key]: event.target.value }))}>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>;
  }
  return <div className="scheme-matcher">
    <div className="scheme-field-summary"><strong>{field.name}</strong><span>{field.region || 'State/district not recorded'} · {cycle ? `${cycle.crop} · ${cycle.season || 'Season not recorded'}` : 'No crop cycle selected'} · {field.area ? `${field.area.value} ${field.area.unit}` : 'Field area not recorded'} · water: {field.water}</span>{(field.origin === 'demo' || cycle?.origin === 'demo') && <p className="scheme-demo">Demonstration records · these are example results, not a real farmer’s eligibility.</p>}</div>
    <p>We use your selected field and crop cycle. Answer a few extra questions to narrow the programmes. You can skip anything you don’t know.</p>
    <div className="scheme-questions">
      {fieldState(field.region) !== 'mp' && <label>Which state is this field in?<select value={answers.state ?? 'unknown'} onChange={event => setAnswers(old => ({ ...old, state: event.target.value as SchemeAnswers['state'] }))}><option value="unknown">Not sure / skip</option><option value="mp">Madhya Pradesh</option><option value="other">Another state</option></select></label>}
      {question('tenure', 'How do you cultivate this field?', [['unknown', 'Not sure / skip'], ['owner', 'Own land'], ['tenant', 'Tenant / oral lease'], ['sharecropper', 'Sharecropper / bataidar'], ['other', 'Other arrangement']])}
      {question('family_land', 'Does your farmer family hold cultivable land in government records?')}
      {question('water_source', 'Do you have a water source for irrigation?')}
    </div>
    <details className="scheme-question-group"><summary>Income support · PM-KISAN & MP Kisan Kalyan</summary><p>Answer for the farmer family: husband, wife and minor children. A rented field does not tell us whether your family owns other land.</p>
      {question('land_date', 'When did your family acquire the recorded cultivable land?', [['unknown', 'Not sure / check land records'], ['before', 'Held on 1 February 2019'], ['inheritance', 'Later inheritance after the landowner’s death'], ['other', 'Later sale, gift or partition']])}
      <p>Check each exclusion below. The elected-office list includes constitutional posts, ministers, MPs/MLAs/MLCs, municipal corporation mayors and district panchayat chairpersons, including former holders.</p><div className="scheme-questions">{INCOME_CONDITIONS.filter(rule => !['family_land', 'land_date'].includes(rule.key)).map(rule => question(rule.key, rule.question))}</div>
    </details>
    <details className="scheme-question-group"><summary>Irrigation, solar pumps & farm projects</summary><div className="scheme-questions">{question('irrigation_benefit', 'Have you received an irrigation-equipment benefit in the last seven years?')}{question('drip_commitment', 'Will your pond project include a drip/sprinkler arrangement?')}{question('solar', 'Are you seeking an agricultural solar pump or pump solarisation?')}{question('infrastructure', 'Are you planning post-harvest or community farming infrastructure?')}{question('organic_group', 'Do you want to join or register an organic-farming group?')}</div></details>
    <p className="scheme-privacy">Extra answers stay in this page’s memory and reset when you leave or switch field/cycle. No Aadhaar, bank account numbers or documents are collected. Field records remain on your device.</p>
    <button type="button" className="text-button" onClick={() => setAnswers({})}>Clear extra answers</button>
    <div className="scheme-results-heading"><h3>Schemes for {field.name}</h3><p role="status">{filtered.filter(item => item.status === 'potential').length} potential matches · {filtered.filter(item => item.status === 'verify').length} need office checks · {filtered.filter(item => item.status === 'needs_info').length} need more details · {filtered.filter(item => item.status === 'not_matching').length} do not match the screened conditions.</p><p>These are preliminary matches, not approval. Application windows and district allocations are not confirmed here.</p></div>
    <div className="scheme-result-tools"><label>Programme type<select value={topic} onChange={event => setTopic(event.target.value)}>{topics.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Search government schemes<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try Kisan, irrigation, seed…" /></label></div>
    <div className="scheme-grid">{relevant.map(decision => <DecisionCard key={decision.scheme.id} decision={decision} />)}</div>
    {excluded.length > 0 && <details className="scheme-nonmatches"><summary>{excluded.length} programmes do not match these conditions · see why</summary><div className="scheme-grid">{excluded.map(decision => <DecisionCard key={decision.scheme.id} decision={decision} />)}</div></details>}
    {!filtered.length && <p role="status">No programmes match this search. Try another term or programme type.</p>}
    <p className="scheme-coverage">Coverage: {GOVERNMENT_SCHEMES.length} central and MP programme entries checked on 9 October 2026. Additional horticulture, livestock, electricity and district programmes may apply. <a href={MP_SCHEME_DIRECTORY} target="_blank" rel="noopener noreferrer">Browse the full official MP scheme directory ↗</a></p>
  </div>;
}

export function SavedFieldSchemes() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null), [error, setError] = useState('');
  const [fieldId, setFieldId] = useState(''), [cycleId, setCycleId] = useState('');
  useEffect(() => {
    let mounted = true, request = 0;
    async function refresh() {
      const token = ++request;
      try { const data = await loadFarm(); if (mounted && token === request) { setSnapshot(data); setError(''); } }
      catch (failure) { if (mounted && token === request) { setSnapshot(null); setError(failure instanceof Error ? failure.message : 'Could not read saved fields.'); } }
    }
    void refresh();
    const visibility = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', visibility);
    return () => { mounted = false; request++; window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  const field = snapshot?.fields.find(item => item.id === fieldId) ?? (snapshot?.fields.length === 1 ? snapshot.fields[0] : null);
  const cycles = snapshot?.cycles.filter(item => item.field_id === field?.id && item.status !== 'archived') ?? [];
  const cycle = cycles.find(item => item.id === cycleId) ?? (cycles.length === 1 ? cycles[0] : null);
  return <div className="saved-field-schemes">
    {error ? <p role="alert" className="form-error">{error} You can still browse the official programme information below.</p> : !snapshot ? <p role="status">Loading your saved fields…</p> : !snapshot.fields.length ? <div className="scheme-start"><h3>Start with your field</h3><p>Save your MP field and crop details to find programmes for your farm.</p><a className="button button-primary" href="/farm">Set up my field →</a></div> : <>
      <div className="scheme-selectors"><label>Field for scheme matching<select value={field?.id ?? ''} onChange={event => { setFieldId(event.target.value); setCycleId(''); }}><option value="" disabled={snapshot.fields.length === 1}>Choose a saved field</option>{snapshot.fields.map(item => <option key={item.id} value={item.id}>{item.name} · {item.region || 'Region not recorded'}</option>)}</select></label>{field && <label>Crop cycle for scheme matching<select value={cycle?.id ?? ''} onChange={event => setCycleId(event.target.value)}><option value="" disabled={cycles.length === 1}>Choose a crop cycle</option>{cycles.map(item => <option key={item.id} value={item.id}>{item.crop} · {item.season || 'Unknown season'} · {item.status}</option>)}</select></label>}</div>
      {field ? <SchemeMatcher key={JSON.stringify([field, cycle, snapshot.revision])} field={field} cycle={cycle} /> : <p>Choose a saved field to see its scheme matches.</p>}
      <a className="scheme-manage" href="/farm#manage-fields">Update field, area, district or crop details →</a>
    </>}
  </div>;
}
