"use client";
import { useEffect, useRef, useState } from "react";
import type { Map, CircleMarker } from "leaflet";
import { MP_VIEW, validMapPoint, type MapPoint } from "@/lib/providers/field-context";

export function FieldMap({point,onSelect}:{point:MapPoint|null;onSelect:(point:MapPoint)=>void}) {
  const element=useRef<HTMLDivElement>(null),map=useRef<Map|null>(null),pin=useRef<CircleMarker|null>(null),select=useRef(onSelect),selected=useRef(point);
  const [error,setError]=useState("");
  useEffect(()=>{select.current=onSelect;selected.current=point;},[onSelect,point]);
  useEffect(()=>{
    let active=true;
    void import("leaflet").then(L=>{
      if(!active || !element.current)return;
      const instance=L.map(element.current,{minZoom:6,maxZoom:18,maxBounds:[[MP_VIEW.south,MP_VIEW.west],[MP_VIEW.north,MP_VIEW.east]],maxBoundsViscosity:1}).setView([23.4,77.5],7);map.current=instance;
      const tiles=L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',referrerPolicy:"strict-origin-when-cross-origin"}).addTo(instance);
      tiles.on("tileerror",()=>{if(active)setError("Map tiles could not load. You can enter coordinates below and continue.");});
      instance.on("click",event=>{const next={latitude:event.latlng.lat,longitude:event.latlng.lng};if(validMapPoint(next))select.current(next);});
      if(selected.current)pin.current=L.circleMarker([selected.current.latitude,selected.current.longitude],{radius:10,color:"#fff",weight:3,fillColor:"#236645",fillOpacity:1}).addTo(instance);
    }).catch(()=>{if(active)setError("Map unavailable. Use manual coordinates below.");});
    return()=>{active=false;map.current?.remove();map.current=null;pin.current=null;};
  },[]);
  useEffect(()=>{if(!point){pin.current?.remove();pin.current=null;return;}if(!map.current)return;let active=true;void import("leaflet").then(L=>{if(!active || !map.current)return;pin.current?.remove();pin.current=L.circleMarker([point.latitude,point.longitude],{radius:10,color:"#fff",weight:3,fillColor:"#236645",fillOpacity:1}).addTo(map.current);});return()=>{active=false;};},[point]);
  return <><div ref={element} className="field-location-map" aria-label="Interactive Madhya Pradesh map; click to place your field pin" />{error && <p role="status">{error}</p>}<p className="map-caption">Tap to place a pin. The view is centred on Madhya Pradesh; its rectangular limits are not official state boundaries. <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">Report a map issue</a>.</p></>;
}
