import Hero from "@/components/Hero";
import ValueProps from "@/components/ValueProps";
import NicheShowcase from "@/components/NicheShowcase";
import HowItWorks from "@/components/HowItWorks";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <ValueProps />
      <NicheShowcase />
      <HowItWorks />
    </main>
  );
}
