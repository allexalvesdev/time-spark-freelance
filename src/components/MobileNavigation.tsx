
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  ClipboardList, 
  BarChart2, 
  Settings,
} from 'lucide-react';
import { usePlatform } from '@/hooks/use-platform';
import { useAuth } from '@/contexts/AuthContext';

const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const { isNative, isAndroid } = usePlatform();
  const { user } = useAuth();
  
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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-50 flex justify-around items-center py-2">
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
  );
};

export default MobileNavigation;
