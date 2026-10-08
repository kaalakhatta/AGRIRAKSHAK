"use client";
import { useEffect, useRef, useState } from "react";
import { FieldSetup } from "./field-setup";
import { FarmWorkspace } from "./farm-workspace";
export function FarmEntry(){
  const [revision,setRevision]=useState(0),manager=useRef<HTMLDetailsElement>(null);
  useEffect(()=>{const reveal=()=>{if(location.hash==="#manage-fields"&&manager.current){manager.current.open=true;manager.current.scrollIntoView({block:"start"});}};reveal();window.addEventListener("hashchange",reveal);return()=>window.removeEventListener("hashchange",reveal);},[]);
  return <><FieldSetup onSaved={()=>setRevision(value=>value+1)}/><details ref={manager} id="manage-fields" className="existing-farm"><summary>Manage existing fields, records and backups</summary><FarmWorkspace key={revision}/></details></>;
}
