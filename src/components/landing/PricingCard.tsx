
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
  trial?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ 
  name, 
  price, 
  period, 
  features, 
  cta, 
  popular = false,
  trial = true
}) => {
  return (
    <Card className={`relative border-border bg-transparent backdrop-blur-sm ${
      popular ? 'relative border-primary shadow-lg' : ''
    }`}>
      {popular && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs uppercase font-bold py-1 px-4 rounded-full">
          Mais Popular
        </div>
      )}
      
      <CardHeader className="text-center p-6">
        <h3 className="text-xl font-bold mb-4">{name}</h3>
        <div className="mb-2">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground ml-1">/{period}</span>
        </div>
        {trial && (
          <div className="text-sm text-primary font-medium">
            14 dias de teste grátis
          </div>
        )}
      </CardHeader>
      
      <CardContent className="px-6 pb-6 pt-0">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm">
              <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className="px-6 pb-6 pt-0">
        <Link to="/auth" className="w-full">
          <Button 
            className={`w-full ${
              popular 
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                : 'bg-black/70 hover:bg-black/80 text-white dark:bg-white/10 dark:hover:bg-white/20'
            }`}
            variant={popular ? "default" : "outline"}
          >
            {cta}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default PricingCard;
