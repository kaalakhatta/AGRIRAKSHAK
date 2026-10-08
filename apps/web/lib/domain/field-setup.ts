import { newMeta, validateData, type FarmData, type Coordinates, type CropCycle, type Field } from "./farm.ts";
export const SETUP_CROPS = [{id:"soybean",label:"Soybean"},{id:"wheat",label:"Wheat"},{id:"chickpea",label:"Gram / chickpea"}] as const;
export function createFieldSetup(data:FarmData,options:{name:string;district:string;coordinates:Coordinates|null;remember:boolean;crop:string;season:string;water:Field["water"]},now:string) {
  if (!SETUP_CROPS.some(crop=>crop.id===options.crop)) throw new Error("Choose soybean, wheat or gram/chickpea.");
  const farm={...newMeta(now),name:"My farm",language:"en" as const,timezone:"Asia/Kolkata"};
  const field:Field={...newMeta(now),farm_id:farm.id,name:options.name.trim(),region:options.district.trim() ? `${options.district.trim()}, Madhya Pradesh` : "Madhya Pradesh",area:null,water:options.water,location:options.remember ? options.coordinates : null};
  const cycle:CropCycle={...newMeta(now),field_id:field.id,crop:SETUP_CROPS.find(crop=>crop.id===options.crop)!.label.replace("Gram / chickpea","Gram/chickpea"),variety:null,season:options.season.trim()||null,status:"planned",sowing_date:null,stage:null,stage_recorded_at:null};
  return {data:validateData({...data,farms:[...data.farms,farm],fields:[...data.fields,field],cycles:[...data.cycles,cycle]}),field,cycle};
}
