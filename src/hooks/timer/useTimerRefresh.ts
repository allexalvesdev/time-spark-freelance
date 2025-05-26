
import { useEffect } from 'react';

export const useTimerRefresh = (loadActiveTimer: () => Promise<void>) => {
  // Load active timer on mount and set up refresh interval
  useEffect(() => {
    loadActiveTimer();
    
    // Refresh active timer every 30 seconds to stay in sync with database
    const interval = setInterval(loadActiveTimer, 30000);
    
    return () => clearInterval(interval);
  }, [loadActiveTimer]);
};
