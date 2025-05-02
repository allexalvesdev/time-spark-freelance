
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
  popular = false,
  trial = false,
  currentPlan = false
}) => {
  return (
    <Card className={`relative h-full border-border ${
      popular ? 'border-primary shadow-lg' : ''
    } bg-black hover:bg-black/80 transition-colors`}>
      {popular && (
        <div className="absolute top-0 right-4 translate-y-4 bg-primary text-primary-foreground text-xs uppercase font-bold py-1 px-4 rounded-full">
          Atual
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
      
      <CardContent className="px-6 pb-4 pt-0">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-white">
              <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className="px-6 pb-6 pt-2">
        <Link to="/auth" className="w-full">
          <Button 
            className={`w-full ${
              currentPlan 
                ? 'pricing-button-secondary bg-purple-700 hover:bg-purple-800' 
                : 'pricing-button-primary bg-purple-500 hover:bg-purple-600'
            }`}
            variant={currentPlan ? "secondary" : "default"}
          >
            {cta}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default PricingCard;
