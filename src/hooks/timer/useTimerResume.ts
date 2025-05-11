
import { TimeEntry } from '@/types';
import { timeEntryService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { getSafeInteger } from '@/utils/timer/safeInteger';
import { calculateAdditionalPausedTime } from '@/utils/timer/durationCalculator';

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
      const pausedAtStr = localStorage.getItem(`timerPausedAt-global-timer-${activeTimeEntry.taskId}`);
      const pausedAt = pausedAtStr ? parseInt(pausedAtStr, 10) : 0;
      
      // Validate paused time to avoid calculation errors
      if (!pausedAt || pausedAt <= 0) {
        console.error('Invalid pausedAt value:', pausedAt);
        // Default to a short pause to avoid calculation errors
        const additionalPausedTime = 1;
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
        localStorage.setItem('timerIsPaused', 'false');
        localStorage.removeItem('timerPausedAt');
        localStorage.setItem('timerPausedTime', totalPausedTime.toString());
        localStorage.setItem(`timerIsPaused-global-timer-${activeTimeEntry.taskId}`, 'false');
        localStorage.removeItem(`timerPausedAt-global-timer-${activeTimeEntry.taskId}`);
        localStorage.setItem(`timerPausedTime-global-timer-${activeTimeEntry.taskId}`, totalPausedTime.toString());
        
        toast({
          title: 'Timer retomado',
          description: 'O cronômetro foi retomado e está contando normalmente.',
        });
        
        return;
      }
      
      // Calculate additional pause time correctly
      const currentTime = Date.now();
      const additionalPausedTime = getSafeInteger(Math.floor((currentTime - pausedAt) / 1000));
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
      localStorage.setItem('timerIsPaused', 'false');
      localStorage.removeItem('timerPausedAt');
      localStorage.setItem('timerPausedTime', totalPausedTime.toString());
      localStorage.setItem(`timerIsPaused-global-timer-${activeTimeEntry.taskId}`, 'false');
      localStorage.removeItem(`timerPausedAt-global-timer-${activeTimeEntry.taskId}`);
      localStorage.setItem(`timerPausedTime-global-timer-${activeTimeEntry.taskId}`, totalPausedTime.toString());
      
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
