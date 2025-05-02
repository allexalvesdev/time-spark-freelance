
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CTASection = () => {
  return (
    <section className="py-16 bg-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para Transformar sua Produtividade?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Junte-se a milhares de profissionais que já estão aproveitando ao máximo cada minuto do seu dia.
        </p>
        <Link to="/auth">
          <Button size="lg" className="bg-black text-white hover:bg-black/90 border border-white/20">
            Comece Grátis Hoje
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CTASection;
