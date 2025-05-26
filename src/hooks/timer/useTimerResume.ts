
import { TimeEntry } from '@/types';
import { timeEntryService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { getSafeInteger } from '@/utils/timer/safeInteger';

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
      const pausedAt = pausedAtStr ? parseInt(pausedAtStr, 10) : null;
      
      // Handle case when pausedAt is missing or invalid
      if (!pausedAt || pausedAt <= 0) {
        // Use current pausedTime as fallback and just resume without adding time
        const totalPausedTime = getSafeInteger(activeTimeEntry.pausedTime || 0);
        
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
        
        // Dispatch a custom event to ensure all timer instances are notified
        const resumeEvent = new CustomEvent('timer-resumed', {
          detail: { taskId: activeTimeEntry.taskId, newPausedTime: totalPausedTime }
        });
        window.dispatchEvent(resumeEvent);
        
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
      
      // Dispatch a custom event to ensure all timer instances are notified
      const resumeEvent = new CustomEvent('timer-resumed', {
        detail: { taskId: activeTimeEntry.taskId, newPausedTime: totalPausedTime }
      });
      window.dispatchEvent(resumeEvent);
      
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
