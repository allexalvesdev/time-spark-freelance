
import { useState, useEffect, useCallback } from 'react';
import { databaseTimerService, ActiveTimer } from '@/services/databaseTimerService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useDatabaseTimer = () => {
  const { user } = useAuth();
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [loading, setLoading] = useState(false);
  const [realTimeSeconds, setRealTimeSeconds] = useState(0);

  const loadActiveTimer = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const timer = await databaseTimerService.getActiveTimer(user.id);
      setActiveTimer(timer);
      
      // Set real-time seconds for immediate display
      if (timer) {
        setRealTimeSeconds(timer.elapsedSeconds);
      } else {
        setRealTimeSeconds(0);
      }
      
      // Dispatch global event for synchronization
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
  }, [user?.id]);

  const startTimer = useCallback(async (taskId: string, projectId: string) => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      await databaseTimerService.startTimer(taskId, projectId, user.id);
      await loadActiveTimer();
      
      // Dispatch immediate synchronization event
      window.dispatchEvent(new CustomEvent('timer-started', { 
        detail: { taskId, projectId, timestamp: Date.now() } 
      }));
      
      toast({
        title: "Timer iniciado",
        description: "O timer foi iniciado com sucesso.",
      });
    } catch (error) {
      console.error('Error starting timer:', error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar o timer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadActiveTimer]);

  const pauseTimer = useCallback(async () => {
    if (!user?.id || !activeTimer) return;
    
    setLoading(true);
    try {
      // Immediately update local state for instant UI feedback
      const pausedTimer = { ...activeTimer, isPaused: true };
      setActiveTimer(pausedTimer);
      
      // Dispatch immediate pause event for synchronization
      window.dispatchEvent(new CustomEvent('timer-paused', { 
        detail: { 
          taskId: activeTimer.taskId, 
          elapsedSeconds: activeTimer.elapsedSeconds,
          timestamp: Date.now()
        } 
      }));
      
      await databaseTimerService.pauseTimer(user.id);
      await loadActiveTimer();
      
      toast({
        title: "Timer pausado",
        description: "O timer foi pausado.",
      });
    } catch (error) {
      console.error('Error pausing timer:', error);
      toast({
        title: "Erro",
        description: "Erro ao pausar o timer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeTimer, loadActiveTimer]);

  const resumeTimer = useCallback(async () => {
    if (!user?.id || !activeTimer) return;
    
    setLoading(true);
    try {
      // Immediately update local state for instant UI feedback
      const resumedTimer = { ...activeTimer, isPaused: false };
      setActiveTimer(resumedTimer);
      
      // Dispatch immediate resume event for synchronization
      window.dispatchEvent(new CustomEvent('timer-resumed', { 
        detail: { 
          taskId: activeTimer.taskId, 
          elapsedSeconds: activeTimer.elapsedSeconds,
          timestamp: Date.now()
        } 
      }));
      
      await databaseTimerService.resumeTimer(user.id);
      await loadActiveTimer();
      
      toast({
        title: "Timer retomado",
        description: "O timer foi retomado.",
      });
    } catch (error) {
      console.error('Error resuming timer:', error);
      toast({
        title: "Erro",
        description: "Erro ao retomar o timer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeTimer, loadActiveTimer]);

  const stopTimer = useCallback(async (completeTask: boolean = false) => {
    if (!user?.id || !activeTimer) return;
    
    setLoading(true);
    try {
      const finalDuration = await databaseTimerService.stopTimer(user.id, completeTask);
      
      // Immediately clear local state
      setActiveTimer(null);
      setRealTimeSeconds(0);
      
      // Dispatch immediate stop event for synchronization
      window.dispatchEvent(new CustomEvent('timer-stopped', { 
        detail: { 
          taskId: activeTimer.taskId, 
          duration: finalDuration, 
          completed: completeTask,
          timestamp: Date.now()
        } 
      }));
      
      toast({
        title: "Timer parado",
        description: completeTask ? "Timer parado e tarefa concluída." : "Timer parado.",
      });
      
      return finalDuration;
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast({
        title: "Erro",
        description: "Erro ao parar o timer.",
        variant: "destructive",
      });
      return 0;
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeTimer]);

  // Real-time counter for active timers
  useEffect(() => {
    if (!activeTimer || activeTimer.isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setRealTimeSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer?.isPaused, activeTimer?.id]);

  // Load active timer on mount and set up refresh interval
  useEffect(() => {
    loadActiveTimer();
    
    // Refresh active timer every 30 seconds to stay in sync with database
    const interval = setInterval(loadActiveTimer, 30000);
    
    return () => clearInterval(interval);
  }, [loadActiveTimer]);

  return {
    activeTimer,
    loading,
    realTimeSeconds: activeTimer ? realTimeSeconds : 0,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    refreshTimer: loadActiveTimer
  };
};
