
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  ClipboardList, 
  BarChart2, 
  Settings,
  Menu
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { state } = useAppContext();
  const { activeTimeEntry } = state;
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/agenda', label: 'Agenda', icon: <CalendarDays size={20} /> },
    { path: '/tarefas', label: 'Tarefas', icon: <ClipboardList size={20} /> },
    { path: '/relatorios', label: 'Relatórios', icon: <BarChart2 size={20} /> }
  ];
  
  const renderNavLink = (path: string, label: string, icon: React.ReactNode) => {
    const active = isActive(path);
    return (
      <Link 
        key={path}
        to={path}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          active 
            ? 'bg-timespark-primary text-white font-medium' 
            : 'hover:bg-timespark-light'
        }`}
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header para Mobile */}
      <header className="lg:hidden border-b p-4 bg-card shadow-sm">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="w-8 h-8 bg-timespark-primary rounded-md flex items-center justify-center">
              <ClipboardList size={20} className="text-white" />
            </span>
            <h1 className="text-xl font-semibold">Workly<span className="text-timespark-accent">.</span></h1>
          </Link>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex flex-col gap-6 py-4">
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-timespark-primary rounded-md flex items-center justify-center">
                      <ClipboardList size={20} className="text-white" />
                    </span>
                    <h1 className="text-xl font-semibold">Workly<span className="text-timespark-accent">.</span></h1>
                  </Link>
                  
                  <Separator />
                  
                  <nav className="flex flex-col gap-1">
                    {navItems.map((item) => (
                      <Link 
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive(item.path) 
                            ? 'bg-timespark-primary text-white font-medium' 
                            : 'hover:bg-timespark-light'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar para Desktop */}
        <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
          <div className="p-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="w-8 h-8 bg-timespark-primary rounded-md flex items-center justify-center">
                <ClipboardList size={20} className="text-white" />
              </span>
              <h1 className="text-xl font-semibold">Workly<span className="text-timespark-accent">.</span></h1>
            </Link>
          </div>
          
          <Separator />
          
          <nav className="flex-1 p-4 flex flex-col gap-1">
            {navItems.map((item) => renderNavLink(item.path, item.label, item.icon))}
          </nav>
          
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <ThemeToggle />
              {activeTimeEntry && (
                <div className="p-3 bg-timespark-light rounded-md mb-4">
                  <div className="text-sm font-medium text-timespark-dark">Timer ativo</div>
                  <div className="text-xs text-timespark-secondary animate-pulse-subtle">
                    Gravando tempo...
                  </div>
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center gap-2"
              asChild
            >
              <Link to="/configuracoes">
                <Settings size={16} />
                <span>Configurações</span>
              </Link>
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container px-4 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
