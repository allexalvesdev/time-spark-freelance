
import React from 'react';
import PricingCard from '@/components/landing/PricingCard';

const PricingSection = () => {
  const pricingPlans = [
    {
      name: "Free",
      subtitle: "Para uso pessoal",
      price: "R$0",
      period: "/sempre",
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
      subtitle: "Para profissionais e freelancers",
      price: "R$29,90",
      period: "/por mês",
      features: [
        "10 projetos ativos",
        "Relatórios detalhados",
        "Importação de dados",
        "Suporte prioritário",
        "Exportação de dados"
      ],
      cta: "Assinar Agora",
      popular: true
    },
    {
      name: "Enterprise",
      subtitle: "Para equipes e empresas",
      price: "R$59,90",
      period: "/por mês",
      features: [
        "Projetos ilimitados",
        "API personalizada",
        "Importação de dados",
        "Suporte 24/7",
        "Gerenciamento de equipe",
        "Customização total"
      ],
      cta: "Contato Comercial",
      popular: false
    }
  ];

  return (
    <section id="pricing" className="w-full py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Escolha o plano que melhor se adapta ao seu fluxo de trabalho e comece a otimizar seu tempo.</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div key={index} className="animate-fade-in" style={{animationDelay: `${index * 150}ms`}}>
              <PricingCard
                name={plan.name}
                subtitle={plan.subtitle}
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
