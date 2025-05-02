
import React from 'react';
import FeatureCard from '@/components/landing/FeatureCard';
import { Clock, BarChart, Calendar, Users, Layers } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: <Clock className="h-10 w-10 text-primary" />,
      title: "Controle de Tempo Preciso",
      description: "Cronometragem precisa para cada tarefa, com relatórios detalhados e análises."
    },
    {
      icon: <BarChart className="h-10 w-10 text-primary" />,
      title: "Relatórios Detalhados",
      description: "Visualize seu tempo e produtividade com gráficos e relatórios personalizados."
    },
    {
      icon: <Calendar className="h-10 w-10 text-primary" />,
      title: "Agendamento Inteligente",
      description: "Planeje suas tarefas com um calendário intuitivo e lembretes automatizados."
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Colaboração em Equipe",
      description: "Gerencie projetos em equipe com funcionalidades de compartilhamento e colaboração."
    },
    {
      icon: <Layers className="h-10 w-10 text-primary" />,
      title: "Múltiplos Projetos",
      description: "Organize seu trabalho em diferentes projetos com categorias e etiquetas."
    }
  ];

  return (
    <section id="features" className="w-full py-20 bg-black relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Recursos Poderosos para Gerenciar seu Tempo</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Conheça as ferramentas que vão ajudar você a aproveitar cada minuto do seu dia.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="animate-fade-in" style={{animationDelay: `${index * 150}ms`}}>
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
  );
};

export default FeaturesSection;
