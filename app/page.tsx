import { AnalysisGenerator } from "@/components/analysis-generator";
import { FrameworkSection } from "@/components/framework-section";
import { Hero } from "@/components/hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <Hero />
        <AnalysisGenerator />
        <FrameworkSection />
      </main>
      <SiteFooter />
    </>
  );
}
