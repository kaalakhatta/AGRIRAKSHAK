"use client";
import { useState } from 'react';
import { CROP_BASICS, CROP_BASICS_CHECKED_ON } from '@/lib/content/crop-basics';
import { DocumentLink } from '@/components/document-link';

export function CropExplorer() {
  const [first, setFirst] = useState('soybean'), [second, setSecond] = useState('wheat'), [query, setQuery] = useState('');
  const [pair, setPair] = useState<readonly [string, string] | null>(null);
  const selected = pair?.map(id => CROP_BASICS.find(crop => crop.id === id)!);
  const crops = CROP_BASICS.filter(crop => `${crop.name} ${crop.group} ${crop.season}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <section id="compare" className="hub-section" aria-labelledby="compare-title">
    <div className="hub-section-heading"><div><p className="eyebrow">Explore your options</p><h2 id="compare-title">Crop comparison & planning</h2><p>Start with soybean, wheat and gram/chickpea. Compare crop basics, then plan using your field’s actual inputs.</p></div><DocumentLink className="button button-primary" href="/plan">Plan for my field →</DocumentLink></div>
    <div className="crop-compare-box"><div><h3>Compare two crops</h3><p>General seasonal context, with sources. Local varieties, dates and suitability need reviewed evidence.</p></div>
      <form className="compare-controls" onSubmit={event => { event.preventDefault(); if (first !== second) setPair([first, second]); }}>
        <label>First crop<select value={first} onChange={event => { setFirst(event.target.value); setPair(null); }}>{CROP_BASICS.map(crop => <option key={crop.id} value={crop.id}>{crop.name}</option>)}</select></label>
        <label>Second crop<select value={second} onChange={event => { setSecond(event.target.value); setPair(null); }}>{CROP_BASICS.map(crop => <option key={crop.id} value={crop.id}>{crop.name}</option>)}</select></label>
        <button className="button button-primary" type="submit" disabled={first === second}>Compare crop facts</button>
      </form>
      {first === second && <p role="status">Choose two different crops to compare.</p>}
      <div aria-live="polite">{selected && <><table className="crop-comparison"><caption>{selected[0].name} and {selected[1].name} · educational comparison</caption><thead><tr><th scope="col">Attribute</th>{selected.map(crop => <th scope="col" key={crop.id}>{crop.name}</th>)}</tr></thead><tbody><tr><th scope="row">Crop group</th>{selected.map(crop => <td key={crop.id}>{crop.group}</td>)}</tr><tr><th scope="row">Usual season context</th>{selected.map(crop => <td key={crop.id}>{crop.season}</td>)}</tr><tr><th scope="row">Sources</th>{selected.map(crop => <td key={crop.id}>{crop.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a>)}</td>)}</tr></tbody></table><p className="hub-caption">Kharif and Rabi represent different seasonal contexts, not interchangeable planting options. This comparison does not rank crops or predict yields. Sources checked {CROP_BASICS_CHECKED_ON}.</p></>}</div>
    </div>
    <div className="crop-explore-heading"><h3>Our initial crop focus</h3><label className="hub-search">Search crops<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, crop group or season" /></label></div>
    <div className="crop-profile-grid">{crops.map(crop => <article className="crop-profile" key={crop.id}><span className="crop-symbol" aria-hidden="true">{crop.symbol}</span><span className="hub-tag">{crop.season} · {crop.group}</span><h3>{crop.name}</h3><p>{crop.note}</p><DocumentLink href="/farm">Create a crop cycle →</DocumentLink></article>)}</div>
    {!crops.length && <p role="status">No matching crop in the initial focus. Other crops can still be entered in your local records.</p>}
    <p className="hub-caption">Seed recommendations and agricultural calendars await genuine agronomy review. The supplied disease model does not support these three crops.</p>
  </section>;
}
