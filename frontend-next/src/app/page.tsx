import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero-section";
import { FeaturesSection } from "@/components/sections/features-section";
import { AiSuiteSection } from "@/components/sections/ai-suite-section";
import { WorkflowSection } from "@/components/sections/workflow-section";
import { CtaSection } from "@/components/sections/cta-section";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#090A0F] text-slate-100 overflow-x-hidden">
      <Navbar />
      <main id="main-content" className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <AiSuiteSection />
        <WorkflowSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
