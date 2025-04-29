
import { useState } from 'react';
import { TimeEntry } from '@/types';
import { timeEntryService } from '@/services';
import { useToast } from '@/hooks/use-toast';

export const useTimeEntries = (userId: string) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);
  const { toast } = useToast();

  const startTimeEntry = async (taskId: string, projectId: string) => {
    try {
      // First stop any existing running timer
      if (activeTimeEntry) {
        await stopTimeEntry();
      }

      const newTimeEntry = await timeEntryService.createTimeEntry({
        taskId,
        projectId,
        startTime: new Date(),
        isRunning: true,
        userId
      });

      setTimeEntries(prev => [newTimeEntry, ...prev]);
      setActiveTimeEntry(newTimeEntry);

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
  };

  const stopTimeEntry = async (completeTask: boolean = false) => {
    if (!activeTimeEntry) return null;

    try {
      const now = new Date();
      const duration = Math.floor((now.getTime() - activeTimeEntry.startTime.getTime()) / 1000);
      
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
  };

  return {
    timeEntries,
    setTimeEntries,
    activeTimeEntry,
    setActiveTimeEntry,
    startTimeEntry,
    stopTimeEntry,
  };
};

export default useTimeEntries;
