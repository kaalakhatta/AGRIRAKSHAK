import { lookupMappedSoil, validMapPoint } from "@/lib/providers/field-context";
export async function POST(request: Request) {
  const headers={"Cache-Control":"no-store"};
  try {
    const raw=await request.text();if(raw.length>1000)return Response.json({detail:"Invalid location input."},{status:400,headers});
    const point=JSON.parse(raw);
    if (!point || typeof point.latitude!=="number" || typeof point.longitude!=="number" || !validMapPoint(point)) return Response.json({detail:"Choose a valid point in the map view."},{status:400,headers});
    return Response.json(await lookupMappedSoil(point,request.signal),{headers});
  } catch { return Response.json({detail:"Mapped soil class unavailable. GPS does not measure soil; you can continue without this estimate."},{status:503,headers}); }
}
