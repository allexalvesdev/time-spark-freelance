
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import BlockedAccountScreen from '@/components/BlockedAccountScreen';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isAccountBlocked } = usePlan();

  // Determine if we should block access to content
  const shouldBlockAccess = user && isAccountBlocked && !isAuthLoading;

  // If account is blocked, show the blocked screen instead of normal content
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
          </div>
        </div>
      )}
    </>
  );
};

export default Layout;
