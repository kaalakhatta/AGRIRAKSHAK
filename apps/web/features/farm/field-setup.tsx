"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FieldMap } from "./field-map";
import { SETUP_CROPS, createFieldSetup } from "@/lib/domain/field-setup";
import { WATER_OPTIONS, todayInZone, type Coordinates, type Snapshot } from "@/lib/domain/farm";
import { validMapPoint, WRB_CLASSES, type MapPoint, type MappedSoil } from "@/lib/providers/field-context";
import { WeatherClient, weatherFresh, setupWeatherTransport, type Weather } from "@/lib/providers/weather";
import { loadFarm, saveFarm } from "@/lib/storage/farm-store";
import { recommendNextSteps } from "@/lib/recommendations/next-steps";

export function FieldSetup({onSaved}:{onSaved:()=>void}) {
  const [step,setStep]=useState<"name"|"map"|"processing"|"context"|"crop"|"steps">("name");
  const [name,setName]=useState(""),[district,setDistrict]=useState(""),[point,setPoint]=useState<MapPoint|null>(null);
  const [mapOpen,setMapOpen]=useState(false),[lat,setLat]=useState(""),[lon,setLon]=useState("");
  const [confirmed,setConfirmed]=useState(false),[consent,setConsent]=useState(false),[remember,setRemember]=useState(false);
  const [weather,setWeather]=useState<Weather|null>(null),[soil,setSoil]=useState<MappedSoil|null>(null);
  const [weatherStatus,setWeatherStatus]=useState("Waiting"),[soilStatus,setSoilStatus]=useState("Waiting");
  const [crop,setCrop]=useState(""),[season,setSeason]=useState(""),[water,setWater]=useState<typeof WATER_OPTIONS[number]>("unknown");
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[saved,setSaved]=useState<{snapshot:Snapshot;fieldId:string;cycleId:string}|null>(null);
  const [now,setNow]=useState(0);
  const heading=useRef<HTMLHeadingElement>(null);
  const requests=useRef(0),controller=useRef<AbortController|null>(null),weatherClient=useRef<WeatherClient|null>(null),saving=useRef(false);
  useEffect(()=>{const initial=setTimeout(()=>setNow(Date.now()),0),timer=setInterval(()=>setNow(Date.now()),15000);const pending=requests;return()=>{clearTimeout(initial);clearInterval(timer);pending.current++;controller.current?.abort();weatherClient.current?.clear();};},[]);
  useEffect(()=>{if(step!=="name"){heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:"start"});}},[step]);
  function choosePoint(next:MapPoint){setPoint(next);setLat(String(next.latitude));setLon(String(next.longitude));setConfirmed(false);setConsent(false);setWeather(null);setSoil(null);setError("");}
  function manual(){const next={latitude:lat.trim()?Number(lat):NaN,longitude:lon.trim()?Number(lon):NaN};if(!validMapPoint(next)){setError("Enter valid coordinates within the Madhya Pradesh map view.");return;}choosePoint(next);}
  function cancel(){requests.current++;controller.current?.abort();weatherClient.current?.clear();setStep("map");setError("");}
  async function processContext(){
    if(!point || !confirmed)return;
    const token=++requests.current;controller.current?.abort();const abort=new AbortController();controller.current=abort;
    setError("");setWeather(null);setSoil(null);setStep("processing");
    if(!consent){setWeatherStatus("Skipped · no sharing consent");setSoilStatus("Skipped · no sharing consent");setStep("context");return;}
    setWeatherStatus("Fetching weather estimates");setSoilStatus("Reading mapped soil class");
    weatherClient.current??=new WeatherClient(setupWeatherTransport());
    const current=()=>token===requests.current;
    await Promise.allSettled([
      weatherClient.current.get(point.latitude,point.longitude).then(data=>{if(current()){setWeather(data);setWeatherStatus("Weather estimates ready");}}).catch(()=>{if(current())setWeatherStatus("Unavailable · you can continue");}),
      fetch("/api/soil-context",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(point),signal:AbortSignal.any([abort.signal,AbortSignal.timeout(15000)]),cache:"no-store"}).then(async response=>{
        if(!response.ok)throw Error("unavailable");const data=await response.json() as MappedSoil;
        if(data.kind!=="soil_map" || !WRB_CLASSES.includes(data.soil_class) || data.reference_year!==null || data.source!=="https://maps.isric.org/" || !Number.isFinite(Date.parse(data.fetched_at)))throw Error("invalid");
        if(current()){setSoil(data);setSoilStatus("Mapped soil class ready");}
      }).catch(()=>{if(current())setSoilStatus("Unavailable · you can continue");})
    ]);
    if(current())setStep("context");
  }
  async function save(event:FormEvent){
    event.preventDefault();if(saving.current || (point && !confirmed))return;saving.current=true;setBusy(true);setError("");
    try{
      const current=await loadFarm(),now=new Date().toISOString();
      const coordinates:Coordinates|null=point?{...point,accuracy_m:null,method:"manual",confirmed_at:now}:null;
      const result=createFieldSetup(current,{name,district,coordinates,remember,crop,season,water},now);
      const snapshot=await saveFarm(result.data,current.revision);setSaved({snapshot,fieldId:result.field.id,cycleId:result.cycle.id});setStep("steps");onSaved();
    }catch(e){setError(e instanceof Error?e.message:"Field could not be saved.");}finally{saving.current=false;setBusy(false);}
  }
  const title={name:"Start with your field.",map:`Locate ${name}.`,processing:"Getting to know your field.",context:"Your field at a glance.",crop:"What are you planting?",steps:"Your first planning steps."}[step];
  const numbers={name:1,map:2,processing:3,context:3,crop:4,steps:5};
  const field=saved?.snapshot.fields.find(f=>f.id===saved.fieldId),cycle=saved?.snapshot.cycles.find(c=>c.id===saved.cycleId);
  const recommendations=field&&cycle?recommendNextSteps({field,cycle,tasks:saved!.snapshot.tasks,soilTests:saved!.snapshot.soil_tests,weather,hasLocation:!!point,today:todayInZone("Asia/Kolkata",new Date(now)),now}):[];
  return <section className="field-setup" aria-label="Set up a field"><div className="setup-heading"><p className="eyebrow">My Farm · Madhya Pradesh</p><p className="setup-step">Step {numbers[step]} of 5</p><h1 ref={heading} tabIndex={-1}>{title}</h1></div>
    <ol className="setup-track" aria-label="Field setup progress">{["Name","Locate","Field context","Crop","First steps"].map((label,index)=><li aria-current={index+1===numbers[step]?"step":undefined} className={index+1===numbers[step]?"current":index+1<numbers[step]?"complete":""} key={label}>{label}</li>)}</ol>
    {error&&<p role="alert" className="form-error">{error}</p>}
    {step==="name"&&<form className="setup-card" onSubmit={e=>{e.preventDefault();if(name.trim()){setError("");setStep("map");}}}><label>Field name<input required maxLength={120} placeholder="For example, East field" value={name} onChange={e=>setName(e.target.value)} autoComplete="off" /></label><p>Give it a name you’ll recognise. Next, place it on the map.</p><button className="button button-primary" type="submit">Locate my field →</button></form>}
    {step==="map"&&<div className="setup-card"><div className="setup-map-heading"><div><h2>Place your field pin</h2><p>Zoom into your area and tap the map. Confirm the point is your field in Madhya Pradesh.</p></div><button className="text-button" type="button" onClick={()=>setStep("name")}>Edit name</button></div>
      {mapOpen?<FieldMap point={point} onSelect={choosePoint}/>:<div className="map-consent"><h3>Locate it on the map</h3><p>Loading the online map shares viewed map areas and your network address with OpenStreetMap. No field name is sent. Manual coordinates work without loading map tiles.</p><button className="button button-secondary" type="button" onClick={()=>setMapOpen(true)}>Open interactive map</button></div>}
      <details><summary>Enter coordinates instead</summary><div className="input-pair"><label>Latitude<input inputMode="decimal" value={lat} onChange={e=>setLat(e.target.value)}/></label><label>Longitude<input inputMode="decimal" value={lon} onChange={e=>setLon(e.target.value)}/></label></div><button className="button button-secondary" type="button" onClick={manual}>Use this point</button></details>
      {point&&<p className="selected-point">Selected point: {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)} · coordinates are temporary by default</p>}
      <label>District <span>(if known)</span><input value={district} maxLength={80} placeholder="For example, Sehore" onChange={e=>setDistrict(e.target.value)}/></label>
      <label className="check-label"><input type="checkbox" checked={confirmed} disabled={!point} onChange={e=>setConfirmed(e.target.checked)}/>I confirm this point represents my field in Madhya Pradesh</label>
      <label className="check-label"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>Share this point through this app’s server with Open-Meteo for weather and ISRIC for a mapped soil estimate</label>
      <label className="check-label"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/>Remember these precise coordinates on this device</label>
      <div className="button-row"><button className="button button-primary" type="button" disabled={!point||!confirmed} onClick={()=>void processContext()}>{consent?"Check my field →":"Continue without online context →"}</button><button className="text-button" type="button" onClick={()=>{setPoint(null);setConfirmed(false);setConsent(false);setStep("crop");}}>Skip location and enter crop details</button></div>
    </div>}
    {step==="processing"&&<div className="setup-processing" role="status"><div className="processing-orbit" aria-hidden="true"><span>🌱</span></div><h2>Checking the point you confirmed</h2><p>We’re requesting weather and mapped soil information independently. Missing data won’t stop your plan.</p><ul><li>✓ Field location confirmed</li><li>{weatherStatus}</li><li>{soilStatus}</li></ul><button className="text-button" type="button" onClick={cancel}>Cancel and adjust location</button></div>}
    {step==="context"&&<div className="setup-card"><div className="context-grid"><article className="context-tile"><span className="eyebrow">Mapped soil estimate</span><h2>{soil?.soil_class??"Soil type unavailable"}</h2><p>{soil?"WRB class from a global soil map. This is an estimate for the map cell, not a laboratory test of your field.":soilStatus}</p>{soil&&<p>Retrieved {new Date(soil.fetched_at).toLocaleString()} · map reference year unknown. <a href={soil.source} target="_blank" rel="noreferrer">ISRIC / SoilGrids · CC BY 4.0</a></p>}<p>GPS does not measure soil texture, pH or nutrients.</p></article><article className="context-tile"><span className="eyebrow">Weather near your point</span><h2>{weather?.current.temperature===null||!weather?"Weather unavailable":`${weather.current.temperature} °C`}</h2>{weather?<><p className={weatherFresh(weather,now)?"success-note":"form-error"}>{weatherFresh(weather,now)?"Current estimates":"Stale estimates · refresh before use"}</p><dl><div><dt>Humidity</dt><dd>{weather.current.humidity??"Unavailable"}{weather.current.humidity!==null?"%":""}</dd></div><div><dt>Rainfall estimate</dt><dd>{weather.current.precipitation===null?"Unavailable":`${weather.current.precipitation} mm / ${weather.interval_seconds/60} min`}</dd></div><div><dt>Wind</dt><dd>{weather.current.wind===null?"Unavailable":`${weather.current.wind} m/s`}</dd></div></dl><p>Model estimate valid {new Date(weather.observed_at).toLocaleString()}. <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo · CC BY 4.0</a></p></>:<p>{weatherStatus}</p>}</article></div><div className="button-row"><button className="button button-primary" type="button" onClick={()=>setStep("crop")}>Choose my crop →</button><button className="text-button" type="button" onClick={()=>void processContext()}>Retry lookups</button><button className="text-button" type="button" onClick={cancel}>Adjust point</button></div></div>}
    {step==="crop"&&<form className="setup-card" onSubmit={save}><p>{name} · {district||"District not entered"}, Madhya Pradesh</p><fieldset disabled={busy}><legend>Choose your crop</legend><div className="crop-choices">{SETUP_CROPS.map(option=><label className={crop===option.id?"crop-choice selected":"crop-choice"} key={option.id}><input type="radio" name="setup-crop" required checked={crop===option.id} onChange={()=>setCrop(option.id)}/><strong>{option.label}</strong><span>Start a local crop-cycle record</span></label>)}</div><label>Intended season<select value={season} onChange={e=>setSeason(e.target.value)}><option value="">I’m not sure yet</option><option value="Kharif">Kharif</option><option value="Rabi">Rabi</option><option value="Zaid">Zaid</option></select></label><label>Water access<select value={water} onChange={e=>setWater(e.target.value as typeof water)}>{WATER_OPTIONS.map(value=><option key={value} value={value}>{value==="unknown"?"I’m not sure yet":value}</option>)}</select></label><p>These are the companion’s planning crops. The existing disease scanner does not yet support soybean, wheat or gram/chickpea.</p><button className="button button-primary" type="submit" disabled={!crop}>{busy?"Saving your field…":"Save field and show first steps →"}</button></fieldset></form>}
    {step==="steps"&&<div className="setup-card"><p className="success-note">{name} and your {cycle?.crop} crop cycle are saved on this device.</p><p>Initial recommendations help you prepare and record the season. Soil-map estimates don’t establish seed suitability; operational crop advice awaits reviewed evidence.</p>{recommendations.filter(item=>!item.id.startsWith("weather")).slice(0,4).map(item=><article className="setup-recommendation" key={item.id}><h2>{item.title}</h2><p>{item.why}</p><a href={item.href==="/farm"?"#manage-fields":item.href}>{item.action} →</a></article>)}<div className="button-row"><a className="button button-primary" href="/today">Continue to Today</a><a className="button button-secondary" href="/plan">Open my plan</a></div></div>}
  </section>;
}
