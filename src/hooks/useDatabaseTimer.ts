
import { useState, useEffect, useCallback } from 'react';
import { databaseTimerService, ActiveTimer } from '@/services/databaseTimerService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useDatabaseTimer = () => {
  const { user } = useAuth();
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [loading, setLoading] = useState(false);

  const loadActiveTimer = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const timer = await databaseTimerService.getActiveTimer(user.id);
      setActiveTimer(timer);
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
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('timer-started', { 
        detail: { taskId, projectId } 
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
      await databaseTimerService.pauseTimer(user.id);
      await loadActiveTimer();
      
      window.dispatchEvent(new CustomEvent('timer-paused', { 
        detail: { taskId: activeTimer.taskId } 
      }));
      
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
      await databaseTimerService.resumeTimer(user.id);
      await loadActiveTimer();
      
      window.dispatchEvent(new CustomEvent('timer-resumed', { 
        detail: { taskId: activeTimer.taskId } 
      }));
      
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
      setActiveTimer(null);
      
      window.dispatchEvent(new CustomEvent('timer-stopped', { 
        detail: { taskId: activeTimer.taskId, duration: finalDuration, completed: completeTask } 
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

  // Load active timer on mount and set up refresh interval
  useEffect(() => {
    loadActiveTimer();
    
    // Refresh active timer every 5 seconds to get updated elapsed time
    const interval = setInterval(loadActiveTimer, 5000);
    
    return () => clearInterval(interval);
  }, [loadActiveTimer]);

  return {
    activeTimer,
    loading,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    refreshTimer: loadActiveTimer
  };
};
