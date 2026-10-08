export type MapPoint = { latitude: number; longitude: number };
// Map viewport bounds, not an administrative-boundary or field-ownership check.
export const MP_VIEW = { south: 21, north: 27, west: 74, east: 83 };
export function validMapPoint(point: MapPoint): boolean {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && point.latitude >= MP_VIEW.south && point.latitude <= MP_VIEW.north && point.longitude >= MP_VIEW.west && point.longitude <= MP_VIEW.east;
}
export const WRB_CLASSES = ["Acrisols","Albeluvisols","Alisols","Andosols","Arenosols","Calcisols","Cambisols","Chernozems","Cryosols","Durisols","Ferralsols","Fluvisols","Gleysols","Gypsisols","Histosols","Kastanozems","Leptosols","Lixisols","Luvisols","Nitisols","Phaeozems","Planosols","Plinthosols","Podzols","Regosols","Solonchaks","Solonetz","Stagnosols","Umbrisols","Vertisols"];
export type MappedSoil = { kind: "soil_map"; soil_class: string; fetched_at: string; reference_year: null; source: string };
export function parseMappedSoil(raw: unknown, now: number): MappedSoil {
  const data = raw as { type?: string; features?: {id?:string;properties?:{pixel_value?:unknown;unit?:string}}[] } | null;
  const feature = data?.type === "FeatureCollection" && Array.isArray(data.features) ? data.features.find(feature=>feature.id === "MostProbable") : undefined;
  const soil = feature?.properties?.pixel_value;
  if (!Number.isFinite(now) || typeof soil !== "string" || !WRB_CLASSES.includes(soil) || feature?.properties?.unit !== "class") throw new Error("A supported mapped soil class is unavailable for this point.");
  return {kind:"soil_map",soil_class:soil,fetched_at:new Date(now).toISOString(),reference_year:null,source:"https://maps.isric.org/"};
}
export async function lookupMappedSoil(point: MapPoint, signal: AbortSignal, http: typeof fetch = fetch, now: () => number = Date.now): Promise<MappedSoil> {
  if (!validMapPoint(point)) throw new Error("Choose a point within the Madhya Pradesh map view.");
  const {latitude:lat,longitude:lon}=point;
  const url=new URL("https://maps.isric.org/mapserv/wrb");
  url.search=new URLSearchParams({SERVICE:"WMS",VERSION:"1.1.1",REQUEST:"GetFeatureInfo",LAYERS:"MostProbable",QUERY_LAYERS:"MostProbable",STYLES:"",SRS:"EPSG:4326",BBOX:`${lon-.001},${lat-.001},${lon+.001},${lat+.001}`,WIDTH:"3",HEIGHT:"3",X:"1",Y:"1",FORMAT:"image/png",INFO_FORMAT:"application/geo+json"}).toString();
  const response=await http(url,{signal:AbortSignal.any([signal,AbortSignal.timeout(12000)]),credentials:"omit",referrerPolicy:"no-referrer",cache:"no-store"});
  if (!response.ok) throw new Error("Mapped soil information is temporarily unavailable.");
  return parseMappedSoil(await response.json(),now());
}
