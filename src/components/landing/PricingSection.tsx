
import React from 'react';
import PricingCard from '@/components/landing/PricingCard';

const PricingSection = () => {
  const pricingPlans = [
    {
      name: "Free",
      price: "R$0",
      period: "sempre",
      features: [
        "1 projeto ativo",
        "Controle de tempo",
        "Relatórios simples"
      ],
      cta: "Começar Grátis",
      popular: false
    },
    {
      name: "Profissional",
      price: "R$29,90",
      period: "por mês",
      features: [
        "10 projetos ativos",
        "Controle de tempo",
        "Relatórios detalhados"
      ],
      cta: "Assinar Agora",
      popular: true
    },
    {
      name: "Enterprise",
      price: "R$59,90",
      period: "por mês",
      features: [
        "Projetos ilimitados",
        "Controle de tempo",
        "Equipes",
        "Relatórios detalhados",
        "Suporte prioritário"
      ],
      cta: "Contato Comercial",
      popular: false
    }
  ];

  return (
    <section id="pricing" className="w-full py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos para Todas as Necessidades</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano que melhor se adapta ao seu fluxo de trabalho e comece a otimizar seu tempo.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div key={index} className="animate-fade-in" style={{animationDelay: `${index * 150}ms`}}>
              <PricingCard
                name={plan.name}
                price={plan.price}
                period={plan.period}
                features={plan.features}
                cta={plan.cta}
                popular={plan.popular}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
