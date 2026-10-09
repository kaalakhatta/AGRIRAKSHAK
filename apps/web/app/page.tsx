import { SiteHeader } from '@/components/site-header';
import { DocumentLink } from '@/components/document-link';
import { ExhibitionStart } from '@/features/farm/exhibition-start';
import { CropExplorer } from '@/features/planning/crop-explorer';
import { ScenarioCalculator } from '@/features/planning/scenario-calculator';
import { SupportDirectory } from '@/features/support/support-directory';
import { FarmHelper } from '@/features/support/farm-helper';

const tools = [
  { symbol: '☀', title: 'Farm dashboard', text: 'Your forecasts, soil, crop prices, schemes and season tools.', href: '/today', action: 'Open my dashboard', status: 'Weather needs a connection' },
  { symbol: '⇄', title: 'Compare & plan', text: 'Explore crop basics and prepare a plan around your field and season.', href: '#compare', action: 'Compare crops', status: 'Soybean · wheat · gram' },
  { symbol: '◎', title: 'Leaf screening', text: 'Capture or upload a leaf for preliminary screening on supported crops.', href: '/scan', action: 'Open Scan', status: 'Pepper · potato · tomato baseline' },
  { symbol: '◷', title: 'Calendar & reminders', text: 'Keep personal tasks tied to your crop cycle, dates and recorded stages.', href: '/plan', action: 'Open my calendar', status: 'Saved on this device' },
  { symbol: '▤', title: 'Soil & season records', text: 'Keep measured soil results, observations, costs, harvests and sales.', href: '/records', action: 'Open Records', status: 'Your entered records' },
  { symbol: '₹', title: 'Revenue & cost planner', text: 'Explore expected receipts and costs using assumptions you enter.', href: '#calculator', action: 'Try the calculator', status: 'Scenario, not a yield forecast' },
];

export default function Home() {
  return <main className="companion-home"><SiteHeader current="/" />
    <section className="companion-hero" aria-labelledby="home-title"><div><p className="eyebrow">Your farming companion · Madhya Pradesh</p><h1 id="home-title">A better view of<br />your growing season.</h1><p className="lede">From choosing your crop to recording your harvest—bring your field, plans and everyday decisions together in AgriRakshak.</p><div className="button-row"><DocumentLink className="button button-primary" href="/farm">Set up my field →</DocumentLink><DocumentLink className="button hub-button-outline" href="#compare">Explore crop tools</DocumentLink></div><p className="hero-privacy">No account needed · Core records stay on your device</p></div>
      <aside className="season-preview" aria-label="Connected farm journey"><p className="season-preview-label">One field. A whole season.</p><div className="season-preview-crops"><span><span aria-hidden="true">🫘</span> Soybean</span><span><span aria-hidden="true">🌾</span> Wheat</span><span><span aria-hidden="true">🌱</span> Gram</span></div><ol><li><span>01</span><div><strong>Plan</strong><p>Your field, crop and calendar</p></div></li><li><span>02</span><div><strong>Monitor</strong><p>Weather, observations and screening</p></div></li><li><span>03</span><div><strong>Review</strong><p>Costs, harvests and season records</p></div></li></ol><p className="season-preview-foot">Initial focus: Sehore · Agricultural guidance appears when applicable evidence is reviewed.</p></aside>
    </section>
    <nav className="hub-shortcuts" aria-label="Home sections"><a className="button button-secondary" href="#dashboard">Farm tools</a><a className="button button-secondary" href="#compare">Crop comparison</a><a className="button button-secondary" href="#calculator">Cost planner</a><a className="button button-secondary" href="#learn">Learning & help</a><a className="button button-secondary" href="#schemes">Government support</a></nav>
    <section id="dashboard" className="hub-section" aria-labelledby="dashboard-title"><div className="hub-section-heading"><div><p className="eyebrow">Everything in one place</p><h2 id="dashboard-title">Your farm dashboard</h2><p>Choose a tool to start. All your field records connect through My Farm.</p></div><DocumentLink href="/farm#manage-fields">Manage existing fields →</DocumentLink></div><div className="farm-tools-grid">{tools.map(tool => <article className="farm-tool" key={tool.title}><span className="tool-symbol" aria-hidden="true">{tool.symbol}</span><h3>{tool.title}</h3><p>{tool.text}</p><span className="hub-caption">{tool.status}</span><DocumentLink href={tool.href}>{tool.action} →</DocumentLink></article>)}</div></section>
    <CropExplorer /><ScenarioCalculator /><FarmHelper /><SupportDirectory />
    <section className="hub-section"><ExhibitionStart /></section>
    <aside className="responsibility-note"><strong>Make informed decisions with the right evidence.</strong><p>Weather and mapped soil are estimates; lab reports are measurements. Preliminary leaf screening is not a diagnosis. Soil nutrients, local seed suitability and treatment cannot be established from GPS or a leaf photograph. Important crop decisions need local expert review.</p></aside>
    <footer className="hub-footer"><span className="brand"><span aria-hidden="true">AR</span>AgriRakshak</span><p>Plan your season. Keep your records. Learn from your farm.</p><a className="button button-secondary" href="#home-title">Back to top ↑</a></footer>
  </main>;
}
