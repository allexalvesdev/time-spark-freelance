
import { useEffect } from 'react';
import { useDatabaseTimer } from '@/hooks/useDatabaseTimer';

export const useTimerDebug = (componentName: string) => {
  const { activeTimer, realTimeSeconds } = useDatabaseTimer();
  
  useEffect(() => {
    console.log(`[${componentName}] Timer state:`, {
      activeTimer: activeTimer ? {
        id: activeTimer.id,
        taskId: activeTimer.taskId,
        isPaused: activeTimer.isPaused,
        elapsedSeconds: activeTimer.elapsedSeconds
      } : null,
      realTimeSeconds
    });
  }, [activeTimer, realTimeSeconds, componentName]);
  
  useEffect(() => {
    const handleTimerEvent = (event: CustomEvent) => {
      console.log(`[${componentName}] Timer event:`, event.type, event.detail);
    };

    const events = ['timer-started', 'timer-paused', 'timer-resumed', 'timer-stopped'];
    
    events.forEach(eventType => {
      window.addEventListener(eventType, handleTimerEvent as EventListener);
    });

    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleTimerEvent as EventListener);
      });
    };
  }, [componentName]);
};
