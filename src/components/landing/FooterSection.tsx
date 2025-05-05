
import React from 'react';

interface FooterSectionProps {
  scrollToFeatures: () => void;
  scrollToTestimonials: () => void;
  scrollToPricing: () => void;
}

const FooterSection: React.FC<FooterSectionProps> = ({ 
  scrollToFeatures, 
  scrollToTestimonials, 
  scrollToPricing 
}) => {
  return (
    <footer className="w-full bg-black py-12 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-archivo-black text-lg mb-4">Focusly<span className="text-primary">.</span></h3>
            <p className="text-muted-foreground">
              Sua ferramenta completa para gerenciamento de tempo e produtividade.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Recursos</h3>
            <ul className="space-y-2">
              <li><button onClick={scrollToFeatures} className="text-muted-foreground hover:text-primary">Controle de Tempo</button></li>
              <li><button onClick={scrollToFeatures} className="text-muted-foreground hover:text-primary">Relatórios</button></li>
              <li><button onClick={scrollToFeatures} className="text-muted-foreground hover:text-primary">Projetos</button></li>
              <li><button onClick={scrollToFeatures} className="text-muted-foreground hover:text-primary">Integrações</button></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Empresa</h3>
            <ul className="space-y-2">
              <li><button className="text-muted-foreground hover:text-primary">Sobre Nós</button></li>
              <li><button className="text-muted-foreground hover:text-primary">Carreiras</button></li>
              <li><button className="text-muted-foreground hover:text-primary">Blog</button></li>
              <li><button className="text-muted-foreground hover:text-primary">Contato</button></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><button className="text-muted-foreground hover:text-primary">Termos de Uso</button></li>
              <li><button className="text-muted-foreground hover:text-primary">Política de Privacidade</button></li>
              <li><button className="text-muted-foreground hover:text-primary">Cookies</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Focusly. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
