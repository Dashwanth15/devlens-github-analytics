// LandingPage.jsx — Main landing page assembler
import "../landing.css";
import LandingNavbar from "./LandingNavbar";
import HeroSection from "./HeroSection";
import ProductPreview from "./ProductPreview";
import FeaturesSection from "./FeaturesSection";
import HowItWorks from "./HowItWorks";
import AIInsights from "./AIInsights";
import UseCases from "./UseCases";
import Testimonials from "./Testimonials";
import StatsSection from "./StatsSection";
import CTASection from "./CTASection";
import LandingFooter from "./LandingFooter";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <LandingNavbar />
      <HeroSection />
      <ProductPreview />
      <div className="section-divider" />
      <FeaturesSection />
      <div className="section-divider" />
      <HowItWorks />
      <div className="section-divider" />
      <AIInsights />
      <div className="section-divider" />
      <UseCases />
      <div className="section-divider" />
      <StatsSection />
      <div className="section-divider" />
      <Testimonials />
      <div className="section-divider" />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
