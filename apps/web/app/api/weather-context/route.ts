import { validMapPoint } from "@/lib/providers/field-context";
import { parseWeather, weatherURL } from "@/lib/providers/weather";

export async function POST(request: Request) {
  const headers={"Cache-Control":"no-store"};
  try {
    const text=await request.text();
    if(text.length>1000)return Response.json({detail:"Invalid location input."},{status:400,headers});
    const point=JSON.parse(text);
    if(!point || typeof point.latitude!=="number" || typeof point.longitude!=="number" || !validMapPoint(point))return Response.json({detail:"Choose a valid point in the map view."},{status:400,headers});
    const response=await fetch(weatherURL(point.latitude,point.longitude),{signal:AbortSignal.any([request.signal,AbortSignal.timeout(6500)]),credentials:"omit",referrerPolicy:"no-referrer",cache:"no-store"});
    if(response.status===429)return Response.json({detail:"Weather service is rate limited."},{status:429,headers:{...headers,"Retry-After":"60"}});
    if(!response.ok)throw Error("unavailable");
    const raw=await response.json();
    parseWeather(raw,Date.now());
    // Only fields required by the client parser. Never echo upstream coordinates.
    return Response.json({utc_offset_seconds:raw.utc_offset_seconds,timezone:raw.timezone,current:raw.current,current_units:raw.current_units,daily:raw.daily,daily_units:raw.daily_units},{headers});
  } catch { return Response.json({detail:"Weather unavailable. You can continue without these estimates."},{status:503,headers}); }
}
