
import { useState, useCallback } from 'react';
import { databaseTimerService, ActiveTimer } from '@/services/databaseTimerService';

export const useTimerLoader = (userId?: string) => {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [loading, setLoading] = useState(false);

  const loadActiveTimer = useCallback(async () => {
    if (!userId) return;
    
    try {
      const timer = await databaseTimerService.getActiveTimer(userId);
      setActiveTimer(timer);
      
      // Dispatch global event for synchronization with exact elapsed seconds
      if (timer) {
        window.dispatchEvent(new CustomEvent('timer-state-loaded', { 
          detail: { 
            taskId: timer.taskId, 
            elapsedSeconds: timer.elapsedSeconds,
            isPaused: timer.isPaused,
            isActive: true
          } 
        }));
      } else {
        window.dispatchEvent(new CustomEvent('timer-state-loaded', { 
          detail: { 
            taskId: null, 
            elapsedSeconds: 0,
            isPaused: false,
            isActive: false
          } 
        }));
      }
    } catch (error) {
      console.error('Error loading active timer:', error);
    }
  }, [userId]);

  return {
    activeTimer,
    setActiveTimer,
    loading,
    setLoading,
    loadActiveTimer
  };
};
