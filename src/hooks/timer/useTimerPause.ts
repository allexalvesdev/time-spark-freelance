
import { TimeEntry } from '@/types';
import { timeEntryService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { getSafeInteger } from '@/utils/timer/safeInteger';

interface UseTimerPauseOptions {
  timeEntries: TimeEntry[];
  setTimeEntries: React.Dispatch<React.SetStateAction<TimeEntry[]>>;
  activeTimeEntry: TimeEntry | null;
  setActiveTimeEntry: React.Dispatch<React.SetStateAction<TimeEntry | null>>;
}

export const useTimerPause = ({
  timeEntries,
  setTimeEntries,
  activeTimeEntry,
  setActiveTimeEntry
}: UseTimerPauseOptions) => {
  const { toast } = useToast();
  
  const pauseTimer = async () => {
    try {
      if (!activeTimeEntry) return;
      
      const currentTime = new Date();
      const startTime = new Date(activeTimeEntry.startTime);
      const pausedTimeSeconds = getSafeInteger(activeTimeEntry.pausedTime || 0);
      
      // Calculate time elapsed until now, not counting already paused time
      const elapsedUntilNow = getSafeInteger(Math.floor((currentTime.getTime() - startTime.getTime()) / 1000) - pausedTimeSeconds);
      
      const updatedTimeEntry: TimeEntry = {
        ...activeTimeEntry,
        isPaused: true,
        isRunning: true, // Timer is still considered running, just paused
        pausedTime: pausedTimeSeconds,  // Keep existing paused time, will be updated when resuming
      };
      
      await timeEntryService.pauseTimeEntry(activeTimeEntry.id, pausedTimeSeconds);
      
      setTimeEntries(prev => Array.isArray(prev) 
        ? prev.map(entry => entry.id === activeTimeEntry.id ? updatedTimeEntry : entry)
        : [updatedTimeEntry]
      );
      
      setActiveTimeEntry(updatedTimeEntry);
      
      // Store the pause state in localStorage for global access
      localStorage.setItem('timerIsPaused', 'true');
      localStorage.setItem('timerPausedAt', currentTime.getTime().toString());
      localStorage.setItem(`timerPausedAt-global-timer-${activeTimeEntry.taskId}`, currentTime.getTime().toString());
      localStorage.setItem(`timerIsPaused-global-timer-${activeTimeEntry.taskId}`, 'true');
      
      // Dispatch a custom event to ensure all timer instances are notified of pause
      const pauseEvent = new CustomEvent('timer-paused', {
        detail: { taskId: activeTimeEntry.taskId, pausedAt: currentTime.getTime() }
      });
      window.dispatchEvent(pauseEvent);
      
      toast({
        title: 'Timer pausado',
        description: 'O cronômetro foi pausado. Você pode retomá-lo quando quiser.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível pausar o cronômetro. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  return { pauseTimer };
};
