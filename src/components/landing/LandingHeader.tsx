
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const LandingHeader: React.FC = () => {
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
            <span className={`font-bold text-2xl ${scrolled ? 'text-foreground' : 'text-white'}`}>
              TimeSpark<span className="text-timespark-accent">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className={`hidden md:flex items-center space-x-6 ${scrolled ? 'text-foreground' : 'text-white'}`}>
            <a href="#features" className="hover:text-timespark-accent transition-colors">Recursos</a>
            <a href="#testimonials" className="hover:text-timespark-accent transition-colors">Depoimentos</a>
            <a href="#pricing" className="hover:text-timespark-accent transition-colors">Preços</a>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link to="/auth">
                <Button className="bg-timespark-accent hover:bg-timespark-accent/90 text-white">
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
              className={`ml-4 p-2 rounded-full ${scrolled ? 'text-foreground' : 'text-white'}`}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background shadow-lg rounded-lg mt-4 p-4 absolute left-4 right-4 animate-in fade-in slide-in-from-top-5">
            <nav className="flex flex-col space-y-4">
              <a href="#features" className="px-4 py-2 hover:bg-muted rounded-md" onClick={toggleMobileMenu}>Recursos</a>
              <a href="#testimonials" className="px-4 py-2 hover:bg-muted rounded-md" onClick={toggleMobileMenu}>Depoimentos</a>
              <a href="#pricing" className="px-4 py-2 hover:bg-muted rounded-md" onClick={toggleMobileMenu}>Preços</a>
              <Link to="/auth" onClick={toggleMobileMenu}>
                <Button className="w-full bg-timespark-accent hover:bg-timespark-accent/90 text-white">
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
