
import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PricingCardProps {
  name: string;
  subtitle?: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  trialDays?: number;
  popular?: boolean;
  trial?: boolean;
  currentPlan?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ 
  name, 
  subtitle,
  price, 
  period, 
  features, 
  cta, 
  trialDays,
  popular = false,
  trial = false,
  currentPlan = false
}) => {
  return (
    <Card className={`relative h-full flex flex-col border-border ${
      popular ? 'border-primary shadow-lg' : ''
    } bg-black hover:bg-black/80 transition-colors`}>
      {popular && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs uppercase font-bold py-1 px-4 rounded-full">
          Mais Popular
        </div>
      )}
      
      <CardHeader className="p-6">
        <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
        {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
        <div className="mb-2">
          <span className="text-4xl font-bold text-white">{price}</span>
          <span className="text-muted-foreground ml-1">{period}</span>
        </div>
      </CardHeader>
      
      <CardContent className="px-6 pb-4 pt-0 flex-grow">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-white">
              <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className="px-6 pb-6 pt-2 mt-auto">
        <div className="w-full flex flex-col items-center">
          <Link to="/auth" className="w-full">
            <Button 
              className="w-full bg-purple-500 hover:bg-purple-600 text-white"
              variant="default"
            >
              {cta}
            </Button>
          </Link>
          {trialDays && (
            <span className="text-xs text-muted-foreground mt-2">
              {trialDays} dias de teste grátis
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default PricingCard;
