
import React, { useEffect, useRef, useState } from 'react';
import LandingHeader from '@/components/landing/LandingHeader';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
import StatsSection from '@/components/landing/StatsSection';
import CTASection from '@/components/landing/CTASection';
import FooterSection from '@/components/landing/FooterSection';
import AnimationStyles from '@/components/landing/AnimationStyles';

const Landing = () => {
  const [scrollY, setScrollY] = useState(0);
  
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (elementRef: React.RefObject<HTMLDivElement>) => {
    if (elementRef.current) {
      window.scrollTo({
        top: elementRef.current.offsetTop - 100,
        behavior: 'smooth',
      });
    }
  };

  const parallaxStyle = {
    backgroundPosition: `50% ${scrollY * 0.5}px`
  };

  return (
    <div className="landing-page w-full min-h-screen overflow-x-hidden bg-black text-white">
      <LandingHeader 
        scrollToFeatures={() => scrollToSection(featuresRef)}
        scrollToTestimonials={() => scrollToSection(testimonialsRef)}
        scrollToPricing={() => scrollToSection(pricingRef)}
      />
      
      <div ref={heroRef}>
        <HeroSection />
      </div>

      <div ref={featuresRef}>
        <FeaturesSection />
      </div>

      <StatsSection parallaxStyle={parallaxStyle} />

      <div ref={testimonialsRef}>
        <TestimonialsSection />
      </div>

      <div ref={pricingRef}>
        <PricingSection />
      </div>

      <CTASection />

      <FooterSection 
        scrollToFeatures={() => scrollToSection(featuresRef)}
        scrollToTestimonials={() => scrollToSection(testimonialsRef)}
        scrollToPricing={() => scrollToSection(pricingRef)}
      />

      <AnimationStyles />
    </div>
  );
};

export default Landing;
