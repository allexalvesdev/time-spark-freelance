
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import BlockedAccountScreen from '@/components/BlockedAccountScreen';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLocation } from 'react-router-dom';
import MobileNavigation from './MobileNavigation';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isAccountBlocked } = usePlan();
  const location = useLocation();

  // Check if the current page is the settings page
  const isSettingsPage = location.pathname === '/configuracoes';
  
  // Determine if we should block access to content
  // Don't block access if user is on settings page
  const shouldBlockAccess = user && isAccountBlocked && !isAuthLoading && !isSettingsPage;

  // If account is blocked and not on settings page, show the blocked screen instead of normal content
  return (
    <>
      {shouldBlockAccess ? (
        <BlockedAccountScreen />
      ) : (
        <div className="min-h-screen flex w-full dark:bg-neutral-950">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 p-4 sm:p-6">{children}</main>
            <MobileNavigation />
          </div>
        </div>
      )}
    </>
  );
};

export default Layout;
