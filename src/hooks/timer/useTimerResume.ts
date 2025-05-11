
import { useState } from 'react';
import { TimeEntry } from '@/types';
import { timeEntryService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { getSafeInteger } from '@/utils/timer/safeInteger';
import { calculateAdditionalPausedTime } from '@/utils/timer/durationCalculator';
import { updatePauseStateStorage } from '@/utils/timer/localStorage';

interface UseTimerResumeOptions {
  timeEntries: TimeEntry[];
  setTimeEntries: React.Dispatch<React.SetStateAction<TimeEntry[]>>;
  activeTimeEntry: TimeEntry | null;
  setActiveTimeEntry: React.Dispatch<React.SetStateAction<TimeEntry | null>>;
}

export const useTimerResume = ({
  timeEntries,
  setTimeEntries,
  activeTimeEntry,
  setActiveTimeEntry
}: UseTimerResumeOptions) => {
  const { toast } = useToast();
  
  const resumeTimer = async () => {
    try {
      if (!activeTimeEntry || !activeTimeEntry.isPaused) return;
      
      // Calculate the additional paused time that needs to be added
      const pausedAt = parseInt(localStorage.getItem(`timerPausedAt-global-timer-${activeTimeEntry.taskId}`) || '0', 10);
      const additionalPausedTime = getSafeInteger(calculateAdditionalPausedTime(pausedAt));
      
      // Add this to the existing paused time
      const totalPausedTime = getSafeInteger((activeTimeEntry.pausedTime || 0) + additionalPausedTime);
      
      const updatedTimeEntry: TimeEntry = {
        ...activeTimeEntry,
        isPaused: false,
        isRunning: true,
        pausedTime: totalPausedTime,
      };
      
      await timeEntryService.resumeTimeEntry(activeTimeEntry.id, totalPausedTime);
      
      setTimeEntries(prev => Array.isArray(prev) 
        ? prev.map(entry => entry.id === activeTimeEntry.id ? updatedTimeEntry : entry)
        : [updatedTimeEntry]
      );
      
      setActiveTimeEntry(updatedTimeEntry);
      
      // Update localStorage
      updatePauseStateStorage(activeTimeEntry.taskId, false, totalPausedTime);
      
      toast({
        title: 'Timer retomado',
        description: 'O cronômetro foi retomado e está contando normalmente.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível retomar o cronômetro. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  return { resumeTimer };
};
