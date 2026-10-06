import Link from "next/link";
import { FarmWorkspace } from "@/features/farm/farm-workspace";
export default function PlanPage() {
  return <main><header className="site-header"><Link className="brand" href="/"><span aria-hidden="true">AR</span>AgriRakshak</Link><nav className="farm-nav" aria-label="Main navigation"><Link href="/">Leaf scanner</Link><Link href="/plan" aria-current="page">Plan</Link><Link href="/today">Today</Link><Link href="/records">Records</Link><Link href="/farm">My Farm</Link></nav></header><FarmWorkspace planOnly /></main>;
}
