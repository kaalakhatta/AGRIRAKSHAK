"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FieldMap } from "./field-map";
import { SETUP_CROPS, createFieldSetup } from "@/lib/domain/field-setup";
import { WATER_OPTIONS, todayInZone, type Coordinates, type Snapshot } from "@/lib/domain/farm";
import { validMapPoint, WRB_CLASSES, type MapPoint, type MappedSoil } from "@/lib/providers/field-context";
import { WeatherClient, weatherFresh, setupWeatherTransport, type Weather } from "@/lib/providers/weather";
import { loadFarm, saveFarm } from "@/lib/storage/farm-store";
import { recommendNextSteps } from "@/lib/recommendations/next-steps";
import { SchemeMatcher } from "@/features/support/scheme-matcher";
import { locateDevice } from "@/lib/providers/device-location";

export function FieldSetup({onSaved}:{onSaved:()=>void}) {
  const [step,setStep]=useState<"name"|"map"|"processing"|"context"|"crop"|"steps">("name");
  const [name,setName]=useState(""),[district,setDistrict]=useState(""),[point,setPoint]=useState<MapPoint|null>(null);
  const [mapOpen,setMapOpen]=useState(false),[lat,setLat]=useState(""),[lon,setLon]=useState("");
  const [confirmed,setConfirmed]=useState(false),[consent,setConsent]=useState(false),[remember,setRemember]=useState(false);
  const [locating,setLocating]=useState(false),[locationStatus,setLocationStatus]=useState("");
  const [pointMethod,setPointMethod]=useState<"gps"|"manual">("manual"),[accuracy,setAccuracy]=useState<number|null>(null);
  const [weather,setWeather]=useState<Weather|null>(null),[soil,setSoil]=useState<MappedSoil|null>(null);
  const [weatherStatus,setWeatherStatus]=useState("Waiting"),[soilStatus,setSoilStatus]=useState("Waiting");
  const [crop,setCrop]=useState(""),[season,setSeason]=useState(""),[water,setWater]=useState<typeof WATER_OPTIONS[number]>("unknown");
  const [area,setArea]=useState(""),[areaUnit,setAreaUnit]=useState<"ha"|"acre"|"m2">("ha");
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[saved,setSaved]=useState<{snapshot:Snapshot;fieldId:string;cycleId:string}|null>(null);
  const [now,setNow]=useState(0);
  const heading=useRef<HTMLHeadingElement>(null);
  const requests=useRef(0),controller=useRef<AbortController|null>(null),weatherClient=useRef<WeatherClient|null>(null),saving=useRef(false);
  const locationRequest=useRef(0),locationController=useRef<AbortController|null>(null);
  useEffect(()=>{const initial=setTimeout(()=>setNow(Date.now()),0),timer=setInterval(()=>setNow(Date.now()),15000);const pending=requests;return()=>{clearTimeout(initial);clearInterval(timer);pending.current++;controller.current?.abort();weatherClient.current?.clear();};},[]);
  useEffect(()=>{if(step!=="name"){heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:"start"});}},[step]);
  useEffect(()=>{const pending=locationRequest;return()=>{pending.current++;locationController.current?.abort();};},[]);
  function cancelLocation(){locationRequest.current++;locationController.current?.abort();setLocating(false);}
  function choosePoint(next:MapPoint){cancelLocation();setPoint(next);setPointMethod("manual");setAccuracy(null);setLocationStatus("");setLat(String(next.latitude));setLon(String(next.longitude));setConfirmed(false);setConsent(false);setWeather(null);setSoil(null);setError("");}
  async function requestDeviceLocation(){
    cancelLocation();const token=++locationRequest.current;const abort=new AbortController();locationController.current=abort;
    setLocating(true);setError("");setLocationStatus("Waiting for location access or a device position…");
    try{
      const result=await locateDevice(navigator.geolocation,abort.signal);
      if(token!==locationRequest.current)return;
      if(!validMapPoint(result))throw Error("Your device position is outside this app’s Madhya Pradesh map view. Locate your MP field manually; your current position has not been saved or sent to map/weather providers.");
      setPoint({latitude:result.latitude,longitude:result.longitude});setLat(String(result.latitude));setLon(String(result.longitude));setPointMethod("gps");setAccuracy(result.accuracy_m);
      setConfirmed(false);setConsent(false);setWeather(null);setSoil(null);setMapOpen(true);
      setLocationStatus("Your device position is pinned below. Move it if needed, then confirm it represents your field.");
    }catch(failure){if(token===locationRequest.current){setLocationStatus("");setError(failure instanceof Error?failure.message:"Device location is unavailable.");}}
    finally{if(token===locationRequest.current)setLocating(false);}
  }
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
      const coordinates:Coordinates|null=point?{...point,accuracy_m:accuracy,method:pointMethod,confirmed_at:now}:null;
      const result=createFieldSetup(current,{name,district,coordinates,remember,crop,season,water,area:area.trim()?{value:Number(area),unit:areaUnit}:null},now);
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
    {step==="map"&&<div className="setup-card"><div className="setup-map-heading"><div><h2>Locate your field</h2><p>Use your device location to place a pin, or choose your field manually. Your phone’s position may differ from your field.</p></div><button className="text-button" type="button" onClick={()=>{cancelLocation();setLocationStatus("");setStep("name");}}>Edit name</button></div>
      <div className="device-location-choice"><h3>Start with my current location</h3><p>Your browser will request location access if it isn’t already allowed. We’ll centre an online map on the returned position. OpenStreetMap receives the viewed map area and your network address; your field name is not sent.</p><div className="button-row"><button className="button button-primary" type="button" disabled={locating} onClick={()=>void requestDeviceLocation()}>{locating?"Finding my location…":"Use my current location"}</button>{locating&&<button className="text-button" type="button" onClick={()=>{cancelLocation();setLocationStatus("Location request cancelled. You can use the map, enter coordinates, or skip.");}}>Cancel location request</button>}</div>{locationStatus&&<p role="status">{locationStatus}</p>}</div>
      {mapOpen?<FieldMap point={point} onSelect={choosePoint} centreOnPoint={pointMethod==="gps"}/>:<div className="map-consent"><h3>Or place the field pin myself</h3><p>Loading the online map shares viewed map areas and your network address with OpenStreetMap. Manual coordinates work without loading map tiles.</p><button className="button button-secondary" type="button" onClick={()=>{cancelLocation();setLocationStatus("");setMapOpen(true);}}>Open interactive map</button></div>}
      <details onToggle={event=>{if(event.currentTarget.open&&locating){cancelLocation();setLocationStatus("");}}}><summary>Enter coordinates instead</summary><div className="input-pair"><label>Latitude<input inputMode="decimal" value={lat} onChange={e=>setLat(e.target.value)}/></label><label>Longitude<input inputMode="decimal" value={lon} onChange={e=>setLon(e.target.value)}/></label></div><button className="button button-secondary" type="button" onClick={manual}>Use this point</button></details>
      {point&&<p className="selected-point">Selected point: {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)} · {pointMethod==="gps"?`device position · reported accuracy ${Math.round(accuracy??0)} m`:"manually placed"} · {remember?"will be saved locally when you save this field":"temporary · not saved to device records"}</p>}
      <label>District <span>(if known)</span><input value={district} maxLength={80} placeholder="For example, Sehore" onChange={e=>setDistrict(e.target.value)}/></label>
      <label className="check-label"><input type="checkbox" checked={confirmed} disabled={!point||locating} onChange={e=>setConfirmed(e.target.checked)}/>I confirm this point represents my field in Madhya Pradesh</label>
      <label className="check-label"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>Share this point through this app’s server with Open-Meteo for weather and ISRIC for a mapped soil estimate</label>
      <label className="check-label"><input type="checkbox" checked={remember} disabled={!point} onChange={e=>setRemember(e.target.checked)}/>Remember this field location on this device</label><p className="location-storage-note">Select Remember to save the confirmed coordinates with your field. You can remove them in Manage existing fields. Default backups leave precise coordinates out.</p>
      <div className="button-row"><button className="button button-primary" type="button" disabled={!point||!confirmed||locating} onClick={()=>void processContext()}>{consent?"Check my field →":"Continue without online context →"}</button><button className="text-button" type="button" onClick={()=>{cancelLocation();setLocationStatus("");setPoint(null);setAccuracy(null);setPointMethod("manual");setConfirmed(false);setConsent(false);setRemember(false);setStep("crop");}}>Skip location and enter crop details</button></div>
    </div>}
    {step==="processing"&&<div className="setup-processing" role="status"><div className="processing-orbit" aria-hidden="true"><span>🌱</span></div><h2>Checking the point you confirmed</h2><p>We’re requesting weather and mapped soil information independently. Missing data won’t stop your plan.</p><ul><li>✓ Field location confirmed</li><li>{weatherStatus}</li><li>{soilStatus}</li></ul><button className="text-button" type="button" onClick={cancel}>Cancel and adjust location</button></div>}
    {step==="context"&&<div className="setup-card"><div className="context-grid"><article className="context-tile"><span className="eyebrow">Mapped soil estimate</span><h2>{soil?.soil_class??"Soil type unavailable"}</h2><p>{soil?"WRB class from a global soil map. This is an estimate for the map cell, not a laboratory test of your field.":soilStatus}</p>{soil&&<p>Retrieved {new Date(soil.fetched_at).toLocaleString()} · map reference year unknown. <a href={soil.source} target="_blank" rel="noreferrer">ISRIC / SoilGrids · CC BY 4.0</a></p>}<p>GPS does not measure soil texture, pH or nutrients.</p></article><article className="context-tile"><span className="eyebrow">Weather near your point</span><h2>{weather?.current.temperature===null||!weather?"Weather unavailable":`${weather.current.temperature} °C`}</h2>{weather?<><p className={weatherFresh(weather,now)?"success-note":"form-error"}>{weatherFresh(weather,now)?"Current estimates":"Stale estimates · refresh before use"}</p><dl><div><dt>Humidity</dt><dd>{weather.current.humidity??"Unavailable"}{weather.current.humidity!==null?"%":""}</dd></div><div><dt>Rainfall estimate</dt><dd>{weather.current.precipitation===null?"Unavailable":`${weather.current.precipitation} mm / ${weather.interval_seconds/60} min`}</dd></div><div><dt>Wind</dt><dd>{weather.current.wind===null?"Unavailable":`${weather.current.wind} m/s`}</dd></div></dl><p>Model estimate valid {new Date(weather.observed_at).toLocaleString()}. <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo · CC BY 4.0</a></p></>:<p>{weatherStatus}</p>}</article></div><div className="button-row"><button className="button button-primary" type="button" onClick={()=>setStep("crop")}>Choose my crop →</button><button className="text-button" type="button" onClick={()=>void processContext()}>Retry lookups</button><button className="text-button" type="button" onClick={cancel}>Adjust point</button></div></div>}
    {step==="crop"&&<form className="setup-card" onSubmit={save}><p>{name} · {district||"District not entered"}, Madhya Pradesh</p><fieldset disabled={busy}><legend>Choose your crop</legend><div className="crop-choices">{SETUP_CROPS.map(option=><label className={crop===option.id?"crop-choice selected":"crop-choice"} key={option.id}><input type="radio" name="setup-crop" required checked={crop===option.id} onChange={()=>setCrop(option.id)}/><strong>{option.label}</strong><span>Start a local crop-cycle record</span></label>)}</div><label>Intended season<select value={season} onChange={e=>setSeason(e.target.value)}><option value="">I’m not sure yet</option><option value="Kharif">Kharif</option><option value="Rabi">Rabi</option><option value="Zaid">Zaid</option></select></label><div className="input-pair"><label>Field area <span>(optional)</span><input type="number" min="0.000001" step="any" inputMode="decimal" value={area} onChange={e=>setArea(e.target.value)}/></label><label>Area unit<select value={areaUnit} onChange={e=>setAreaUnit(e.target.value as typeof areaUnit)}><option value="ha">Hectares</option><option value="acre">Acres</option><option value="m2">Square metres</option></select></label></div><label>Water access<select value={water} onChange={e=>setWater(e.target.value as typeof water)}>{WATER_OPTIONS.map(value=><option key={value} value={value}>{value==="unknown"?"I’m not sure yet":value}</option>)}</select></label><p className="location-storage-note">{point?(remember?"Your confirmed field location will be saved on this device with the field.":"Your selected location is temporary and will not be saved with the field."):"No precise location will be saved."}</p><button className="text-button" type="button" onClick={()=>setStep("map")}>Review or change field location</button><p>These are the companion’s planning crops. The existing disease scanner does not yet support soybean, wheat or gram/chickpea.</p><button className="button button-primary" type="submit" disabled={!crop}>{busy?"Saving your field…":"Save field and show first steps →"}</button></fieldset></form>}
    {step==="steps"&&<div className="setup-card"><p className="success-note">{name} and your {cycle?.crop} crop cycle are saved on this device.</p><p className="location-storage-note">{field?.location?"Your confirmed field location is saved on this device. You can remove it in Manage existing fields.":"No precise field location was saved. You can add one later in Manage existing fields."}</p><p>Initial recommendations help you prepare and record the season. Soil-map estimates don’t establish seed suitability; operational crop advice awaits reviewed evidence.</p>{recommendations.filter(item=>!item.id.startsWith("weather")).slice(0,4).map(item=><article className="setup-recommendation" key={item.id}><h2>{item.title}</h2><p>{item.why}</p><a href={item.href==="/farm"?"#manage-fields":item.href}>{item.action} →</a></article>)}<div className="button-row"><a className="button button-primary" href="/today">Continue to Today</a><a className="button button-secondary" href="/plan">Open my plan</a></div><section className="setup-schemes" aria-label="Government schemes for your saved field"><p className="eyebrow">Central & Madhya Pradesh programmes</p><h2>Government schemes for your field</h2>{field&&<SchemeMatcher key={`${field.id}:${field.updated_at}:${cycle?.id??"none"}`} field={field} cycle={cycle??null}/>}</section></div>}
  </section>;
}
