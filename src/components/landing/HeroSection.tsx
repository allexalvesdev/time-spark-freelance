
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="w-full relative min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4 z-10 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Gerencie seu tempo, <br className="hidden md:block" />
          <span className="text-primary">potencialize seus resultados</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          O Workly é a ferramenta de gerenciamento de tempo que vai transformar sua produtividade e organização.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link to="/auth">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Comece Agora <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
            Ver Recursos
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
