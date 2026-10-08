import { DocumentLink } from "./document-link";
export function SiteHeader({ current }: { current: string }) {
  return <header className="site-header"><DocumentLink className="brand" href="/"><span aria-hidden="true">AR</span>AgriRakshak</DocumentLink><nav className="farm-nav" aria-label="Main navigation">{[["/","Home"],["/plan","Plan"],["/today","Today"],["/scan","Scan"],["/records","Records"],["/farm","My Farm"]].map(([href,label])=><DocumentLink key={href} href={href} aria-current={current===href ? "page" : undefined}>{label}</DocumentLink>)}</nav></header>;
}
