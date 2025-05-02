
import React from 'react';
import TestimonialCard from '@/components/landing/TestimonialCard';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Carlos Silva",
      role: "Designer Freelancer",
      image: "https://randomuser.me/api/portraits/men/1.jpg",
      content: "O Workly transformou meu fluxo de trabalho. Agora consigo gerenciar meus projetos freelance com muito mais eficiência e transparência para meus clientes."
    },
    {
      name: "Ana Martins",
      role: "Gerente de Projetos",
      image: "https://randomuser.me/api/portraits/women/2.jpg",
      content: "Como gerente de uma equipe remota, o Workly nos permitiu sincronizar melhor nosso trabalho e ter uma visão clara de quanto tempo cada tarefa está consumindo."
    },
    {
      name: "Rodrigo Mendes",
      role: "Desenvolvedor de Software",
      image: "https://randomuser.me/api/portraits/men/3.jpg",
      content: "A precisão do controle de tempo e os relatórios detalhados me ajudaram a identificar onde estou gastando tempo desnecessário no desenvolvimento."
    }
  ];

  return (
    <section id="testimonials" className="w-full py-20 bg-black/80">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">O que Nossos Clientes Dizem</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Veja como o Workly está ajudando profissionais como você a gerenciar seu tempo.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="animate-fade-in" style={{animationDelay: `${index * 150}ms`}}>
              <TestimonialCard
                name={testimonial.name}
                role={testimonial.role}
                image={testimonial.image}
                content={testimonial.content}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
