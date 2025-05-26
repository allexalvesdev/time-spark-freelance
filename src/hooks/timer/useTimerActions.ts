
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
    
    console.log('[TimerActions] 🚀 Starting timer for task:', taskId?.slice(0, 8));
    setLoading(true);
    
    try {
      await databaseTimerService.startTimer(taskId, projectId, userId);
      await loadActiveTimer();
      
      // Dispatch event for INSTANT UI feedback
      window.dispatchEvent(new CustomEvent('timer-started', { 
        detail: { taskId, projectId, timestamp: Date.now() } 
      }));
      
      toast({
        title: "Timer iniciado",
        description: "O timer foi iniciado com sucesso.",
      });
    } catch (error) {
      console.error('[TimerActions] ❌ Error starting timer:', error);
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
    
    console.log('[TimerActions] ⏸️ Pausing timer for task:', activeTimer.taskId?.slice(0, 8));
    
    try {
      // Get EXACT current elapsed seconds before any operations
      const currentElapsedSeconds = activeTimer.elapsedSeconds;
      console.log('[TimerActions] 📊 Exact elapsed at pause:', currentElapsedSeconds);
      
      // FIRST: Dispatch IMMEDIATE event for instant UI freeze
      window.dispatchEvent(new CustomEvent('timer-paused', { 
        detail: { 
          taskId: activeTimer.taskId, 
          elapsedSeconds: currentElapsedSeconds,
          timestamp: Date.now()
        } 
      }));
      
      // SECOND: Update local state immediately
      const pausedTimer = { ...activeTimer, isPaused: true, elapsedSeconds: currentElapsedSeconds };
      setActiveTimer(pausedTimer);
      setRealTimeSeconds(currentElapsedSeconds);
      
      // THIRD: Do database operation in background
      setLoading(true);
      await databaseTimerService.pauseTimer(userId);
      await loadActiveTimer();
      
      toast({
        title: "Timer pausado",
        description: "O timer foi pausado instantaneamente.",
      });
    } catch (error) {
      console.error('[TimerActions] ❌ Error pausing timer:', error);
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
    
    console.log('[TimerActions] ▶️ Resuming timer for task:', activeTimer.taskId?.slice(0, 8));
    
    try {
      // FIRST: Dispatch IMMEDIATE event for instant UI resume
      window.dispatchEvent(new CustomEvent('timer-resumed', { 
        detail: { 
          taskId: activeTimer.taskId, 
          elapsedSeconds: activeTimer.elapsedSeconds,
          timestamp: Date.now()
        } 
      }));
      
      // SECOND: Update local state immediately
      const resumedTimer = { ...activeTimer, isPaused: false };
      setActiveTimer(resumedTimer);
      
      // THIRD: Do database operation in background
      setLoading(true);
      await databaseTimerService.resumeTimer(userId);
      await loadActiveTimer();
      
      toast({
        title: "Timer retomado",
        description: "O timer foi retomado instantaneamente.",
      });
    } catch (error) {
      console.error('[TimerActions] ❌ Error resuming timer:', error);
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
    
    console.log('[TimerActions] 🛑 Stopping timer for task:', activeTimer.taskId?.slice(0, 8));
    
    try {
      setLoading(true);
      const finalDuration = await databaseTimerService.stopTimer(userId, completeTask);
      
      // Clear state immediately
      setActiveTimer(null);
      setRealTimeSeconds(0);
      
      // Dispatch stop event
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
      console.error('[TimerActions] ❌ Error stopping timer:', error);
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
