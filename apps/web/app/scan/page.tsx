import { SiteHeader } from "@/components/site-header";
import { LeafAnalyzer } from "@/components/leaf-analyzer";
export default function ScanPage() {
  return <main><SiteHeader current="/scan" /><section className="hero"><div><p className="eyebrow">Supporting tool · preliminary crop screening</p><h1>Take a closer look.</h1><p className="lede">Capture or upload a leaf image. Choose a supported crop and consent to server analysis. If the model is unavailable, no prediction is invented.</p></div><div className="hero-note"><strong>Separate model coverage</strong><span>Bell pepper · potato · tomato</span><p>The Sehore companion’s soybean, wheat and gram/chickpea records do not establish scanner coverage.</p></div></section><LeafAnalyzer /></main>;
}
