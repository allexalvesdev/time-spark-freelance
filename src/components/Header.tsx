
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import ActiveTimerDisplay from './ActiveTimerDisplay';
import { useAppContext } from '@/contexts/AppContext';

export function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const { state } = useAppContext();
  const { activeTimeEntry } = state || {};
  
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
    
    return 'Focusly';
  };
  
  return (
    <header className="border-b border-border bg-background px-4 h-14 flex items-center justify-between relative z-20">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-lg font-medium">{getPageTitle()}</h1>
      </div>
      
      <div className="flex-1 flex justify-center items-center">
        {activeTimeEntry && (
          <div className="hidden sm:block max-w-[300px]">
            <ActiveTimerDisplay />
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        
        {user && (
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
