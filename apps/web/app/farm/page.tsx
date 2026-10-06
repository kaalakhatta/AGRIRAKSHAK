import Link from "next/link";
import { FarmWorkspace } from "@/features/farm/farm-workspace";
export default function FarmPage() {
  return <main><header className="site-header"><Link className="brand" href="/"><span aria-hidden="true">AR</span>AgriRakshak</Link><nav className="farm-nav" aria-label="Main navigation"><Link href="/">Leaf scanner</Link><Link href="/plan">Plan</Link><Link href="/today">Today</Link><Link href="/farm" aria-current="page">My Farm</Link></nav></header><FarmWorkspace /></main>;
}
