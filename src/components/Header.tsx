
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, Plus, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import ActiveTimerDisplay from './ActiveTimerDisplay';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  // Force timer sync on page load to ensure header timer is always in sync
  useEffect(() => {
    // Use a small timeout to ensure all components are mounted
    const timeoutId = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('force-timer-sync'));
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Update the key whenever the page refreshes to force re-render
  const refreshKey = React.useMemo(() => Date.now().toString(), []);

  if (!user) return null;

  return (
    <header className="border-b p-4 bg-background sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <h1 className="font-bold text-xl">Focusly</h1>
        </Link>

        <div className="flex items-center gap-2">
          {/* Active Timer Display with key to force re-render */}
          <ActiveTimerDisplay key={refreshKey} />

          <div className="flex items-center gap-2">
            {!isMobile && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                asChild
              >
                <Link to="/new-project">
                  <Plus className="w-4 h-4 mr-1" />
                  Novo Projeto
                </Link>
              </Button>
            )}

            <Button 
              variant="ghost" 
              size="icon"
              asChild
            >
              <Link to="/settings">
                <User className="w-5 h-5" />
              </Link>
            </Button>

            <Button 
              variant="ghost" 
              size="icon"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
