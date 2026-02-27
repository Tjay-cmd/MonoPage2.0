import Hero from "@/components/Hero";
import ValueProps from "@/components/ValueProps";
import NicheShowcase from "@/components/NicheShowcase";
import HowItWorks from "@/components/HowItWorks";
import FloatingPaths from "@/components/FloatingPaths";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero + ValueProps share the flowing animation — it spans both and exits right */}
      <div className="relative">
        <Hero />
        <ValueProps />
        <FloatingPaths className="absolute top-0 left-0 right-0 bottom-0 z-10 pointer-events-none" />
      </div>
      <NicheShowcase />
      <HowItWorks />
    </main>
  );
}
