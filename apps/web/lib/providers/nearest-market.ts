import { MARKET_TOWNS } from './market-towns.ts';
import type { MapPoint } from './field-context.ts';
import type { PriceSeries } from './market-prices.ts';
type StoragePort=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const prefix='agrirakshak-market-order-1:';
function validPoint(point:MapPoint|null):point is MapPoint {
  return !!point&&Number.isFinite(point.latitude)&&Number.isFinite(point.longitude)&&point.latitude>=21&&point.latitude<=27&&point.longitude>=74&&point.longitude<=83;
}
export function marketDistance(a:MapPoint,b:MapPoint) {
  const radians=(n:number)=>n*Math.PI/180,lat=radians(b.latitude-a.latitude),lon=radians(b.longitude-a.longitude);
  const h=Math.sin(lat/2)**2+Math.cos(radians(a.latitude))*Math.cos(radians(b.latitude))*Math.sin(lon/2)**2;
  return 6371*2*Math.asin(Math.sqrt(Math.min(1,Math.max(0,h))));
}
export function marketOrder(point:MapPoint|null):string[] {
  if(!validPoint(point))return [];
  return [...MARKET_TOWNS].sort((a,b)=>marketDistance(point,a)-marketDistance(point,b)||a.market.localeCompare(b.market)).map(m=>m.market);
}
export function rememberMarketOrder(storage:StoragePort,fieldId:string,point:MapPoint|null,series:PriceSeries[]|null=null) {
  // Retain just one public town name. A complete distance ordering could reveal
  // much more about a temporary field point than the selected mandi needs.
  try{const match=series&&validPoint(point)?initialMarket(series,null,point):null;
    const market=match?.reason==='nearby'?match.market:marketOrder(point)[0];
    if(market)storage.setItem(prefix+fieldId,JSON.stringify([market]));else storage.removeItem(prefix+fieldId);
  }catch{/* Optional same-tab preference only. */}
}
export function readMarketOrder(storage:StoragePort,fieldId:string):string[] {
  try{const raw=storage.getItem(prefix+fieldId);if(!raw||raw.length>15000)return [];const value:unknown=JSON.parse(raw);
    if(!Array.isArray(value)||!value.length||value.length>MARKET_TOWNS.length||!value.every(v=>typeof v==='string'&&MARKET_TOWNS.some(m=>m.market===v)))throw Error('Invalid market preference.');
    const selected=[value[0]];
    if(value.length>1)storage.setItem(prefix+fieldId,JSON.stringify(selected));
    return selected;
  }catch{return [];}
}
export function initialMarket(series:PriceSeries[],region:string|null,point:MapPoint|null,remembered:string[]=[]):{market:string;reason:'nearby'|'district'|'latest'|'missing'} {
  const available=new Set(series.filter(s=>s.points.length).map(s=>s.market));
  const order=validPoint(point)?marketOrder(point):remembered;
  const nearby=order.find(name=>available.has(name));if(nearby)return {market:nearby,reason:'nearby'};
  const district=region?.split(',')[0].trim().toLowerCase();
  const local=MARKET_TOWNS.filter(m=>m.district.toLowerCase()===district&&available.has(m.market)).sort((a,b)=>Number(b.market.toLowerCase()===`${district} apmc`)-Number(a.market.toLowerCase()===`${district} apmc`)||a.market.localeCompare(b.market))[0];
  if(local)return {market:local.market,reason:'district'};
  const latest=[...series].filter(s=>s.points.length).sort((a,b)=>b.points.at(-1)!.date.localeCompare(a.points.at(-1)!.date)||a.market.localeCompare(b.market))[0];
  return latest?{market:latest.market,reason:'latest'}:{market:'',reason:'missing'};
}
