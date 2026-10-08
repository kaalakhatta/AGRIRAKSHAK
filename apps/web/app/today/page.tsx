import { SiteHeader } from "@/components/site-header";
import { FarmWorkspace } from "@/features/farm/farm-workspace";
export default function Page() { return <main><SiteHeader current="/today" /><FarmWorkspace todayOnly /></main>; }
