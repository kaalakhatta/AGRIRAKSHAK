import Link from "next/link";
import { RecordsWorkspace } from "@/features/soil/records-workspace";
export default function RecordsPage(){return <main><header className="site-header"><Link className="brand" href="/"><span aria-hidden="true">AR</span>AgriRakshak</Link><nav className="farm-nav" aria-label="Main navigation"><Link href="/">Leaf scanner</Link><Link href="/plan">Plan</Link><Link href="/today">Today</Link><Link href="/records" aria-current="page">Records</Link><Link href="/farm">My Farm</Link></nav></header><RecordsWorkspace /></main>;}
