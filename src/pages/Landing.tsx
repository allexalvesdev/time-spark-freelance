
import React, { useEffect, useRef, useState } from 'react';
import LandingHeader from '@/components/landing/LandingHeader';
import FeatureCard from '@/components/landing/FeatureCard';
import TestimonialCard from '@/components/landing/TestimonialCard';
import PricingCard from '@/components/landing/PricingCard';
import { ArrowRight, Clock, BarChart, Calendar, Users, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

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

  const parallaxStyle = {
    backgroundPosition: `50% ${scrollY * 0.5}px`
  };

  const features = [
    {
      icon: <Clock className="h-10 w-10 text-timespark-accent" />,
      title: "Controle de Tempo Preciso",
      description: "Cronometragem precisa para cada tarefa, com relatórios detalhados e análises."
    },
    {
      icon: <BarChart className="h-10 w-10 text-timespark-accent" />,
      title: "Relatórios Detalhados",
      description: "Visualize seu tempo e produtividade com gráficos e relatórios personalizados."
    },
    {
      icon: <Calendar className="h-10 w-10 text-timespark-accent" />,
      title: "Agendamento Inteligente",
      description: "Planeje suas tarefas com um calendário intuitivo e lembretes automatizados."
    },
    {
      icon: <Users className="h-10 w-10 text-timespark-accent" />,
      title: "Colaboração em Equipe",
      description: "Gerencie projetos em equipe com funcionalidades de compartilhamento e colaboração."
    },
    {
      icon: <Layers className="h-10 w-10 text-timespark-accent" />,
      title: "Múltiplos Projetos",
      description: "Organize seu trabalho em diferentes projetos com categorias e etiquetas."
    }
  ];

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

  const pricingPlans = [
    {
      name: "Free",
      price: "R$0",
      period: "sempre",
      features: [
        "1 projeto ativo",
        "Controle de tempo básico",
        "Relatórios simples",
        "Acesso por 30 dias"
      ],
      cta: "Começar Grátis",
      popular: false
    },
    {
      name: "Profissional",
      price: "R$29",
      period: "por mês",
      features: [
        "10 projetos ativos",
        "Controle de tempo avançado",
        "Relatórios detalhados",
        "Exportação de dados",
        "Acesso a API"
      ],
      cta: "Assinar Agora",
      popular: true
    },
    {
      name: "Enterprise",
      price: "R$79",
      period: "por mês",
      features: [
        "Projetos ilimitados",
        "Ferramentas de colaboração",
        "Relatórios personalizados",
        "Integrações avançadas",
        "Suporte prioritário"
      ],
      cta: "Contato Comercial",
      popular: false
    }
  ];

  const fadeInClass = "animate-fade-in";

  return (
    <div className="landing-page overflow-x-hidden">
      <LandingHeader />
      
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center bg-background pattern-grid"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background"></div>
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
            <Button size="lg" variant="outline">
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>

      <section ref={featuresRef} className="py-20 bg-background pattern-dots relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background"></div>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Recursos Poderosos para Gerenciar seu Tempo</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Conheça as ferramentas que vão ajudar você a aproveitar cada minuto do seu dia.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className={`${fadeInClass}`} style={{animationDelay: `${index * 150}ms`}}>
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div 
        className="h-64 bg-fixed bg-cover bg-center relative"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80)',
          ...parallaxStyle
        }}
      >
        <div className="absolute inset-0 bg-primary/70"></div>
        <div className="container mx-auto px-4 h-full flex items-center justify-center relative z-10">
          <h3 className="text-2xl md:text-4xl font-bold text-white text-center">
            Mais de 1,000 profissionais já otimizaram seu tempo com o Workly
          </h3>
        </div>
      </div>

      <section ref={testimonialsRef} className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">O que Nossos Clientes Dizem</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Veja como o TimeSpark está ajudando profissionais como você a gerenciar seu tempo.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={`${fadeInClass}`} style={{animationDelay: `${index * 150}ms`}}>
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

      <section ref={pricingRef} className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos para Todas as Necessidades</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Escolha o plano que melhor se adapta ao seu fluxo de trabalho e comece a otimizar seu tempo.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`${fadeInClass}`} style={{animationDelay: `${index * 150}ms`}}>
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

      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para Transformar sua Produtividade?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de profissionais que já estão aproveitando ao máximo cada minuto do seu dia.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              Comece Grátis Hoje
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-background pattern-grid relative py-12">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/50"></div>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Workly<span className="text-timespark-accent">.</span></h3>
              <p className="text-muted-foreground">
                Sua ferramenta completa para gerenciamento de tempo e produtividade.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Recursos</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary">Controle de Tempo</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Relatórios</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Projetos</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Integrações</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Empresa</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary">Sobre Nós</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Carreiras</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Contato</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary">Termos de Uso</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Política de Privacidade</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Workly. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      <style>
        {`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }
        `}
      </style>
    </div>
  );
};

export default Landing;
