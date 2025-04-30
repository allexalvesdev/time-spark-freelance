
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

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
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileNavClick = (callback: () => void) => {
    callback();
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/90 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className={`font-bold text-2xl ${scrolled ? 'text-foreground' : 'text-foreground dark:text-white'}`}>
              Workly<span className="text-primary">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className={`hidden md:flex items-center space-x-6 ${
            scrolled 
              ? 'text-foreground' 
              : 'text-foreground dark:text-white'
          }`}>
            <button onClick={scrollToFeatures} className="hover:text-primary transition-colors">Recursos</button>
            <button onClick={scrollToTestimonials} className="hover:text-primary transition-colors">Depoimentos</button>
            <button onClick={scrollToPricing} className="hover:text-primary transition-colors">Preços</button>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link to="/auth">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {scrolled ? 'Entrar' : 'Começar Agora'}
                </Button>
              </Link>
            </div>
          </nav>

          {/* Mobile Navigation */}
          <div className="flex items-center md:hidden">
            <ThemeToggle />
            <button
              onClick={toggleMobileMenu}
              className={`ml-4 p-2 rounded-full ${
                scrolled 
                  ? 'text-foreground' 
                  : 'text-foreground dark:text-white'
              }`}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background shadow-lg rounded-lg mt-4 p-4 absolute left-4 right-4 animate-in fade-in slide-in-from-top-5">
            <nav className="flex flex-col space-y-4">
              <button onClick={() => handleMobileNavClick(scrollToFeatures)} className="px-4 py-2 hover:bg-muted rounded-md">Recursos</button>
              <button onClick={() => handleMobileNavClick(scrollToTestimonials)} className="px-4 py-2 hover:bg-muted rounded-md">Depoimentos</button>
              <button onClick={() => handleMobileNavClick(scrollToPricing)} className="px-4 py-2 hover:bg-muted rounded-md">Preços</button>
              <Link to="/auth" onClick={toggleMobileMenu}>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Entrar
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default LandingHeader;
