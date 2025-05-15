
import { useEffect, useCallback } from 'react';
import { activeTimerService } from '@/services/activeTimerService';
import { TimeEntry } from '@/types';

interface UseTimerSyncOptions {
  onTimerUpdated?: (timeEntry: TimeEntry | null, serverTime: number) => void;
  taskId?: string; // Optional taskId to filter by
  skipInitialSync?: boolean;
}

/**
 * Hook to synchronize timer state with the server
 */
export const useTimerSync = ({
  onTimerUpdated,
  taskId,
  skipInitialSync = false
}: UseTimerSyncOptions = {}) => {
  const syncWithServer = useCallback(async () => {
    try {
      const response = await activeTimerService.getActiveTimer();
      if (!response) return null;
      
      const { timeEntry, serverTime } = response;
      
      // If we have a specific taskId, only use the timeEntry if it matches
      if (taskId && timeEntry && timeEntry.taskId !== taskId) {
        onTimerUpdated?.(null, serverTime);
        return null;
      }
      
      onTimerUpdated?.(timeEntry, serverTime);
      return { timeEntry, serverTime };
    } catch (error) {
      console.error('Error syncing timer with server:', error);
      return null;
    }
  }, [onTimerUpdated, taskId]);
  
  // Initial sync with server
  useEffect(() => {
    if (skipInitialSync) return;
    
    // Sync on component mount
    syncWithServer();
    
    // Set up interval for periodic sync (every 30 seconds)
    const intervalId = setInterval(() => {
      syncWithServer();
    }, 30000);
    
    // Sync when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncWithServer();
      }
    };
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for timer events
    const handleTimerEvent = () => {
      syncWithServer();
    };
    
    // Add event listeners for timer events
    window.addEventListener('timer-started', handleTimerEvent);
    window.addEventListener('timer-paused', handleTimerEvent);
    window.addEventListener('timer-resumed', handleTimerEvent);
    window.addEventListener('timer-stopped', handleTimerEvent);
    
    // Check localStorage for any changes that might indicate timer activity
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key && e.key.includes('timer')) {
        syncWithServer();
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    
    // Dispatch a custom event to force sync across all components
    const handleForceSync = () => {
      syncWithServer();
    };
    
    window.addEventListener('force-timer-sync', handleForceSync);
    
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('timer-started', handleTimerEvent);
      window.removeEventListener('timer-paused', handleTimerEvent);
      window.removeEventListener('timer-resumed', handleTimerEvent);
      window.removeEventListener('timer-stopped', handleTimerEvent);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('force-timer-sync', handleForceSync);
    };
  }, [syncWithServer, skipInitialSync]);
  
  return { 
    syncWithServer 
  };
};
