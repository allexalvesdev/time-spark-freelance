
import { useState } from 'react';
import { TimeEntry } from '@/types';
import { databaseService } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';

export const useTimerManagement = (userId: string) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);
  const { toast } = useToast();

  const startTimer = async (taskId: string, projectId: string) => {
    try {
      if (activeTimeEntry) {
        await stopTimer();
      }

      const newTimeEntry = await databaseService.createTimeEntry({
        taskId,
        projectId,
        userId,
        startTime: new Date(),
        isRunning: true,
      });

      setTimeEntries(prev => [newTimeEntry, ...prev]);
      setActiveTimeEntry(newTimeEntry);
    } catch (error: any) {
      console.error('Error starting timer:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o cronômetro. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const stopTimer = async () => {
    try {
      if (!activeTimeEntry) return;

      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - activeTimeEntry.startTime.getTime()) / 1000);

      const updatedTimeEntry: TimeEntry = {
        ...activeTimeEntry,
        endTime,
        duration,
        isRunning: false,
      };

      await databaseService.updateTimeEntry(updatedTimeEntry);

      setTimeEntries(prev => prev.map(entry => 
        entry.id === activeTimeEntry.id ? updatedTimeEntry : entry
      ));
      setActiveTimeEntry(null);
    } catch (error: any) {
      console.error('Error stopping timer:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível parar o cronômetro. Tente novamente.',
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
    startTimer,
    stopTimer,
  };
};
