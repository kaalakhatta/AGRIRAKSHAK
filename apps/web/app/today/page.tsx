import { SiteHeader } from "@/components/site-header";
import { FarmDashboard } from "@/features/dashboard/farm-dashboard";
export default function Page() { return <main><SiteHeader current="/today" /><FarmDashboard /></main>; }
