
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';

export function Header() {
  const { user } = useAuth();
  const location = useLocation();
  
  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/novo-projeto') return 'Novo Projeto';
    if (path === '/agenda') return 'Agenda';
    if (path === '/tarefas') return 'Tarefas';
    if (path === '/relatorios') return 'Relatórios';
    if (path === '/configuracoes') return 'Configurações';
    if (path.includes('/projeto/')) return 'Detalhes do Projeto';
    
    return 'Workly';
  };
  
  return (
    <header className="border-b border-border bg-background px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-lg font-medium">{getPageTitle()}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
