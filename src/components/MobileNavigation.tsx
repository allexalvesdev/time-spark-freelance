
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  ClipboardList, 
  BarChart2, 
  Settings,
  Square,
} from 'lucide-react';
import { usePlatform } from '@/hooks/use-platform';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import useTimerState from '@/hooks/useTimerState';
import { Button } from '@/components/ui/button';

const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const { isNative, isAndroid } = usePlatform();
  const { user } = useAuth();
  const { state, getActiveTaskName, stopTimer } = useAppContext();
  const { activeTimeEntry } = state || {};
  
  const { getFormattedTime } = useTimerState({
    persistKey: activeTimeEntry ? `global-timer-${activeTimeEntry.taskId}` : undefined,
    autoStart: true
  });
  
  // Only show the mobile navigation when in a native app or on a mobile device
  // AND when the user is authenticated
  if ((!isNative && window.innerWidth > 768) || !user) return null;
  
  // Don't show navigation on auth page
  if (location.pathname === '/auth') return null;
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/agenda', label: 'Agenda', icon: <CalendarDays size={20} /> },
    { path: '/tarefas', label: 'Tarefas', icon: <ClipboardList size={20} /> },
    { path: '/relatorios', label: 'Relatórios', icon: <BarChart2 size={20} /> },
    { path: '/configuracoes', label: 'Configurações', icon: <Settings size={20} /> }
  ];
  
  const handleStopTimer = () => {
    stopTimer(true); // Auto-complete task on stop
  };

  return (
    <>
      {activeTimeEntry && (
        <div className="fixed bottom-16 left-2 right-2 bg-background border rounded-md shadow-md p-3 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <div className="text-sm font-mono font-medium">{getFormattedTime()}</div>
              <div className="text-xs opacity-70 truncate max-w-[150px]">
                {getActiveTaskName() || 'Tarefa ativa'}
              </div>
            </div>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleStopTimer} 
            className="h-8 px-3 text-xs"
          >
            <Square className="h-3 w-3 mr-1" />
            Parar
          </Button>
        </div>
      )}
      
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-40 flex justify-around items-center py-2">
        {navItems.map((item) => (
          <Link 
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center p-2 ${
              isActive(item.path) 
                ? 'text-primary' 
                : 'text-muted-foreground'
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
};

export default MobileNavigation;
