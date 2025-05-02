
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '../ThemeToggle';

interface LandingHeaderProps {
  scrollToFeatures: () => void;
  scrollToTestimonials: () => void;
  scrollToPricing: () => void;
}

const LandingHeader: React.FC<LandingHeaderProps> = ({ 
  scrollToFeatures, 
  scrollToTestimonials, 
  scrollToPricing 
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full ${
        isScrolled ? 'bg-black/80 backdrop-blur-md shadow-md py-2' : 'py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-white">
            Workly<span className="text-primary">.</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <button 
              className="text-sm text-white hover:text-primary transition-colors"
              onClick={scrollToFeatures}
            >
              Recursos
            </button>
            <button 
              className="text-sm text-white hover:text-primary transition-colors"
              onClick={scrollToTestimonials}
            >
              Depoimentos
            </button>
            <button 
              className="text-sm text-white hover:text-primary transition-colors"
              onClick={scrollToPricing}
            >
              Preços
            </button>
          </nav>

          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <Link to="/auth">
              <Button 
                className="bg-primary text-white hover:bg-primary/90"
                size="sm"
              >
                Entrar
              </Button>
            </Link>
            <button 
              className="block md:hidden text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 6h16M4 12h16M4 18h16" 
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <nav className="mt-4 md:hidden py-4 bg-black/90 border-t border-white/10">
            <div className="flex flex-col space-y-4">
              <button 
                className="text-white hover:text-primary px-4"
                onClick={() => {
                  scrollToFeatures();
                  setIsMobileMenuOpen(false);
                }}
              >
                Recursos
              </button>
              <button 
                className="text-white hover:text-primary px-4"
                onClick={() => {
                  scrollToTestimonials();
                  setIsMobileMenuOpen(false);
                }}
              >
                Depoimentos
              </button>
              <button 
                className="text-white hover:text-primary px-4"
                onClick={() => {
                  scrollToPricing();
                  setIsMobileMenuOpen(false);
                }}
              >
                Preços
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default LandingHeader;
