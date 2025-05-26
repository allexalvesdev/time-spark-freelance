import { useCallback } from 'react';
import { Timer } from '@/types/timer';
import * as timerService from '@/services/databaseTimerService';
import { emitTimerUpdate } from '@/utils/events';

export function useTimerActions() {
  const startTimer = useCallback(async (taskId: string): Promise<Timer | null> => {
    try {
      const timer = await timerService.startTimer(taskId);
      // Emite evento APÓS a ação ser concluída
      if (timer) {
        emitTimerUpdate(timer);
      }
      return timer;
    } catch (error) {
      console.error('Error starting timer:', error);
      return null;
    }
  }, []);

  const pauseTimer = useCallback(async (timerId: string): Promise<Timer | null> => {
    try {
      const timer = await timerService.pauseTimer(timerId);
      // Emite evento APÓS a ação ser concluída
      if (timer) {
        emitTimerUpdate(timer);
      }
      return timer;
    } catch (error) {
      console.error('Error pausing timer:', error);
      return null;
    }
  }, []);

  const resumeTimer = useCallback(async (timerId: string): Promise<Timer | null> => {
    try {
      const timer = await timerService.resumeTimer(timerId);
      // Emite evento APÓS a ação ser concluída
      if (timer) {
        emitTimerUpdate(timer);
      }
      return timer;
    } catch (error) {
      console.error('Error resuming timer:', error);
      return null;
    }
  }, []);

  const stopTimer = useCallback(async (timerId: string): Promise<void> => {
    try {
      await timerService.stopTimer(timerId);
      // Emite evento de parada APÓS a ação ser concluída
      emitTimerUpdate(null);
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  }, []);

  return {
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer
  };
}
