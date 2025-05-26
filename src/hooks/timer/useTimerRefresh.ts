
import { useEffect } from 'react';
import { ActiveTimer } from '@/services/databaseTimerService';

export const useTimerRefresh = (refetch: () => Promise<void>) => {
  // Load active timer on mount and set up refresh interval
  useEffect(() => {
    refetch();
    
    // Refresh active timer every 30 seconds to stay in sync with database
    const interval = setInterval(refetch, 30000);
    
    return () => clearInterval(interval);
  }, [refetch]);
};
