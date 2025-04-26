
import { useState, useEffect, useRef } from 'react';
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

interface UseTimerOptions {
  autoStart?: boolean;
  initialTime?: number;
}

const useTimer = (options: UseTimerOptions = {}) => {
  const { autoStart = false, initialTime = 0 } = options;
  const [isRunning, setIsRunning] = useState(autoStart);
  const [elapsedTime, setElapsedTime] = useState(initialTime);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedTime * 1000;
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current !== null) {
          const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedTime(currentElapsed);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const start = () => {
    if (!isRunning) {
      setIsRunning(true);
    }
  };

  const stop = () => {
    if (isRunning) {
      setIsRunning(false);
    }
  };

  const reset = () => {
    setElapsedTime(0);
    startTimeRef.current = null;
  };

  const getFormattedTime = () => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':');
  };

  return {
    isRunning,
    elapsedTime,
    start,
    stop,
    reset,
    getFormattedTime,
  };
};

export default useTimer;
