import Navbar from "@/components/marketing/Navbar"
import Hero from "@/components/marketing/Hero"
import HowItWorks from "@/components/marketing/HowItWorks"
import FeatureCards from "@/components/marketing/FeatureCards"
import TemplateGallery from "@/components/marketing/TemplateGallery"
import SocialProof from "@/components/marketing/SocialProof"
import FAQ from "@/components/marketing/FAQ"
import Footer from "@/components/marketing/Footer"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <FeatureCards />
        <TemplateGallery />
        <SocialProof />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
