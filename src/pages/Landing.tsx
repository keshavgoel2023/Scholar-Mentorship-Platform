import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { AIFeatures } from "@/components/landing/AIFeatures";
import { MentorDiscovery } from "@/components/landing/MentorDiscovery";
import { Testimonials } from "@/components/landing/Testimonials";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { Footer } from "@/components/landing/Footer";
import { ChatbotButton } from "@/components/landing/ChatbotButton";
import { BackToTop } from "@/components/landing/BackToTop";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <AIFeatures />
      <MentorDiscovery />
      <Testimonials />
      <div id="pricing">
        <PricingSection />
      </div>
      <FAQSection />
      <Footer />
      <ChatbotButton />
      <BackToTop />
    </div>
  );
};

export default Landing;
