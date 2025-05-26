
import { useState } from 'react';
import { TimeEntry, Task } from '@/types';
import { timeEntryService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { getSafeInteger } from '@/utils/timer/safeInteger';

interface UseTimerStartOptions {
  userId: string;
  timeEntries: TimeEntry[];
  setTimeEntries: React.Dispatch<React.SetStateAction<TimeEntry[]>>;
  setActiveTimeEntry: React.Dispatch<React.SetStateAction<TimeEntry | null>>;
  stopCurrentTimer: () => Promise<void>;
}

export const useTimerStart = ({
  userId,
  timeEntries,
  setTimeEntries,
  setActiveTimeEntry,
  stopCurrentTimer
}: UseTimerStartOptions) => {
  const { toast } = useToast();
  
  const startTimer = async (taskId: string, projectId: string) => {
    try {
      // Stop any currently running timer first
      await stopCurrentTimer();

      // Create new time entry
      const newTimeEntry = await timeEntryService.createTimeEntry({
        taskId,
        projectId,
        userId,
        startTime: new Date(),
        isRunning: true,
        isPaused: false,
        pausedTime: 0,
      });

      setTimeEntries(prev => Array.isArray(prev) ? [newTimeEntry, ...prev] : [newTimeEntry]);
      setActiveTimeEntry(newTimeEntry);
      
      // Store the active time entry ID globally for persistence
      localStorage.setItem('activeTimeEntryId', newTimeEntry.id);
      localStorage.setItem('activeTaskId', taskId);
      localStorage.setItem('timerStartTime', new Date().getTime().toString());
      localStorage.setItem('timerIsPaused', 'false');
      localStorage.setItem('timerPausedTime', '0');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o cronômetro. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return { startTimer };
};
