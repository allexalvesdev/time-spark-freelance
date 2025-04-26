
import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ name, price, period, features, cta, popular = false }) => {
  return (
    <Card className={`h-full flex flex-col relative bg-background/50 backdrop-blur-sm ${
      popular ? 'border-primary shadow-lg scale-105 z-10' : 'border-border'
    }`}>
      {popular && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs uppercase font-bold py-1 px-4 rounded-full">
          Mais Popular
        </div>
      )}
      
      <CardHeader className="text-center pb-0">
        <h3 className="text-xl font-bold">{name}</h3>
      </CardHeader>
      
      <CardContent className="flex-grow flex flex-col items-center text-center pt-6">
        <div className="mb-6">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground">/{period}</span>
        </div>
        
        <ul className="space-y-3 w-full mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Link to="/auth" className="w-full">
          <Button 
            className={`w-full ${
              popular 
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                : 'bg-secondary hover:bg-secondary/90'
            }`}
          >
            {cta}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default PricingCard;
