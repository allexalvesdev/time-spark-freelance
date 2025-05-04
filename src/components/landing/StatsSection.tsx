
import React from 'react';

interface StatsSectionProps {
  parallaxStyle: React.CSSProperties;
}

const StatsSection: React.FC<StatsSectionProps> = ({ parallaxStyle }) => {
  return (
    <div 
      className="w-full h-64 bg-fixed bg-cover bg-center relative"
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
  );
};

export default StatsSection;
