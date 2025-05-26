
import { useCallback } from 'react';
import { databaseTimerService, ActiveTimer } from '@/services/databaseTimerService';
import { toast } from '@/hooks/use-toast';

interface UseTimerActionsOptions {
  userId?: string;
  activeTimer: ActiveTimer | null;
  setActiveTimer: (timer: ActiveTimer | null) => void;
  setLoading: (loading: boolean) => void;
  setRealTimeSeconds: (seconds: number) => void;
  loadActiveTimer: () => Promise<void>;
}

export const useTimerActions = ({
  userId,
  activeTimer,
  setActiveTimer,
  setLoading,
  setRealTimeSeconds,
  loadActiveTimer
}: UseTimerActionsOptions) => {
  
  const startTimer = useCallback(async (taskId: string, projectId: string) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      await databaseTimerService.startTimer(taskId, projectId, userId);
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
  }, [userId, loadActiveTimer, setLoading]);

  const pauseTimer = useCallback(async () => {
    if (!userId || !activeTimer) return;
    
    setLoading(true);
    try {
      // Get current elapsed seconds before pausing
      const currentElapsedSeconds = activeTimer.elapsedSeconds;
      
      // Immediately update local state for instant UI feedback
      const pausedTimer = { ...activeTimer, isPaused: true };
      setActiveTimer(pausedTimer);
      
      // Stop the real-time counter immediately when pausing
      setRealTimeSeconds(currentElapsedSeconds);
      
      // Dispatch immediate pause event with current elapsed seconds
      window.dispatchEvent(new CustomEvent('timer-paused', { 
        detail: { 
          taskId: activeTimer.taskId, 
          elapsedSeconds: currentElapsedSeconds,
          isPaused: true,
          timestamp: Date.now()
        } 
      }));
      
      await databaseTimerService.pauseTimer(userId);
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
  }, [userId, activeTimer, loadActiveTimer, setActiveTimer, setLoading, setRealTimeSeconds]);

  const resumeTimer = useCallback(async () => {
    if (!userId || !activeTimer) return;
    
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
          isPaused: false,
          timestamp: Date.now()
        } 
      }));
      
      await databaseTimerService.resumeTimer(userId);
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
  }, [userId, activeTimer, loadActiveTimer, setActiveTimer, setLoading]);

  const stopTimer = useCallback(async (completeTask: boolean = false) => {
    if (!userId || !activeTimer) return;
    
    setLoading(true);
    try {
      const finalDuration = await databaseTimerService.stopTimer(userId, completeTask);
      
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
  }, [userId, activeTimer, setActiveTimer, setLoading, setRealTimeSeconds]);

  return {
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer
  };
};
