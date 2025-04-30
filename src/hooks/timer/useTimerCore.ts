import { useState, useCallback } from 'react';
import { TimeEntry } from '@/types';
import { timeEntryService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { 
  safeSetItem, 
  safeRemoveItem, 
  isLocalStorageAvailable 
} from './storageCore';
import { 
  persistTimerState,
  updateGlobalTimerState
} from './timerState';

/**
 * Core timer management functionality
 */
export const useTimerCore = (userId: string) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);
  const { toast } = useToast();

  const startTimeEntry = useCallback(async (taskId: string, projectId: string) => {
    try {
      // First stop any existing running timer
      if (activeTimeEntry) {
        await stopTimeEntry();
      }

      const startTime = new Date();
      const newTimeEntry = await timeEntryService.createTimeEntry({
        taskId,
        projectId,
        startTime,
        isRunning: true,
        userId
      });

      setTimeEntries(prev => [newTimeEntry, ...prev]);
      setActiveTimeEntry(newTimeEntry);

      // Store active timer data in localStorage for global synchronization
      const startTimeMs = startTime.getTime();
      
      if (isLocalStorageAvailable()) {
        safeSetItem('activeTimeEntryId', newTimeEntry.id);
        safeSetItem('activeTaskId', taskId);
        safeSetItem('timerStartTime', startTimeMs.toString());
        
        // Also store in the task-specific timer store
        const timerKey = `global-timer-${taskId}`;
        safeSetItem(`timerStartTime-${timerKey}`, startTimeMs.toString());
        safeSetItem(`timerIsRunning-${timerKey}`, 'true');
        safeSetItem(`timerElapsedTime-${timerKey}`, '0');
        
        // Store the full timer state
        const timerState = JSON.stringify({
          running: true,
          elapsed: 0,
          startTime: startTimeMs,
          lastUpdate: Date.now()
        });
        safeSetItem(`timerState-${timerKey}`, timerState);
      }
      
      console.log('[useTimerCore] Timer started:', {
        taskId,
        startTime: startTimeMs,
        newTimeEntry
      });

      return newTimeEntry;
    } catch (error) {
      console.error('Error starting time entry:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o tempo. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [activeTimeEntry, userId, toast]);

  const stopTimeEntry = useCallback(async (completeTaskFlag: boolean = false) => {
    if (!activeTimeEntry) return null;

    try {
      const now = new Date();
      const duration = Math.floor((now.getTime() - activeTimeEntry.startTime.getTime()) / 1000);
      
      console.log('[useTimerCore] Stopping time entry:', {
        timeEntryId: activeTimeEntry.id,
        taskId: activeTimeEntry.taskId,
        duration,
        completeTask: completeTaskFlag
      });
      
      const updatedTimeEntry: TimeEntry = {
        ...activeTimeEntry,
        endTime: now,
        duration,
        isRunning: false
      };

      await timeEntryService.updateTimeEntry(updatedTimeEntry);

      setTimeEntries(prev => 
        prev.map(entry => 
          entry.id === activeTimeEntry.id ? updatedTimeEntry : entry
        )
      );
      
      const stoppedEntry = { ...updatedTimeEntry };
      
      if (isLocalStorageAvailable()) {
        // Clear the global timer state from localStorage
        safeRemoveItem('activeTimeEntryId');
        safeRemoveItem('activeTaskId');
        safeRemoveItem('timerStartTime');
        
        // Also clear the specific task timer state
        const taskId = activeTimeEntry.taskId;
        safeRemoveItem(`timerState-global-timer-${taskId}`);
        safeRemoveItem(`timerIsRunning-global-timer-${taskId}`);
        safeRemoveItem(`timerStartTime-global-timer-${taskId}`);
        safeRemoveItem(`timerElapsedTime-global-timer-${taskId}`);
      }

      setActiveTimeEntry(null);

      return stoppedEntry;
    } catch (error) {
      console.error('Error stopping time entry:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível parar o tempo. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [activeTimeEntry, toast]);

  return {
    timeEntries,
    setTimeEntries,
    activeTimeEntry, 
    setActiveTimeEntry,
    startTimeEntry,
    stopTimeEntry
  };
};
