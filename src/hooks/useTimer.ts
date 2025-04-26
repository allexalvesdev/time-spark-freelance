import { useState, useEffect, useRef } from 'react';
import { TimeEntry } from '@/types';
import { timeEntryService } from '@/services';
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

      const newTimeEntry = await timeEntryService.createTimeEntry({
        taskId,
        projectId,
        userId,
        startTime: new Date(),
        isRunning: true,
      });

      setTimeEntries(prev => [newTimeEntry, ...prev]);
      setActiveTimeEntry(newTimeEntry);
      
      // Save active entry ID to localStorage
      localStorage.setItem('activeTimeEntryId', newTimeEntry.id);
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

      await timeEntryService.updateTimeEntry(updatedTimeEntry);

      setTimeEntries(prev => prev.map(entry => 
        entry.id === activeTimeEntry.id ? updatedTimeEntry : entry
      ));
      setActiveTimeEntry(null);
      
      // Clear from localStorage
      localStorage.removeItem('activeTimeEntryId');
      localStorage.removeItem('timerStartTime');
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

  // Load active time entry from localStorage on component mount
  useEffect(() => {
    const loadActiveTimeEntry = async () => {
      const activeTimeEntryId = localStorage.getItem('activeTimeEntryId');
      if (activeTimeEntryId && userId) {
        try {
          const entries = await timeEntryService.loadTimeEntries();
          const active = entries.find(entry => entry.id === activeTimeEntryId);
          if (active && active.isRunning) {
            setActiveTimeEntry(active);
          } else {
            // Clear invalid data
            localStorage.removeItem('activeTimeEntryId');
            localStorage.removeItem('timerStartTime');
          }
        } catch (error) {
          console.error('Error loading active time entry:', error);
        }
      }
    };

    loadActiveTimeEntry();
  }, [userId]);

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
  persistKey?: string; // Key for localStorage persistence
}

const useTimer = (options: UseTimerOptions = {}) => {
  const { autoStart = false, initialTime = 0, persistKey } = options;
  const [isRunning, setIsRunning] = useState(autoStart);
  const [elapsedTime, setElapsedTime] = useState(initialTime);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Initialize timer from localStorage if available
  useEffect(() => {
    if (persistKey) {
      const savedStartTime = localStorage.getItem(`timerStartTime-${persistKey}`);
      const savedIsRunning = localStorage.getItem(`timerIsRunning-${persistKey}`);
      
      if (savedStartTime && savedIsRunning === 'true') {
        const startTimeMs = parseInt(savedStartTime, 10);
        const currentElapsed = Math.floor((Date.now() - startTimeMs) / 1000);
        setElapsedTime(currentElapsed);
        setIsRunning(true);
        startTimeRef.current = startTimeMs;
      }
    }
  }, [persistKey]);

  useEffect(() => {
    if (isRunning) {
      // If timer is starting, set the start time reference
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now() - elapsedTime * 1000;
        
        // Save to localStorage if persistKey is provided
        if (persistKey) {
          localStorage.setItem(`timerStartTime-${persistKey}`, startTimeRef.current.toString());
          localStorage.setItem(`timerIsRunning-${persistKey}`, 'true');
        }
      }
      
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
      
      // Clear persistence when stopped
      if (!isRunning && persistKey) {
        localStorage.setItem(`timerIsRunning-${persistKey}`, 'false');
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, persistKey]);

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
    
    // Clear persistence data
    if (persistKey) {
      localStorage.removeItem(`timerStartTime-${persistKey}`);
      localStorage.removeItem(`timerIsRunning-${persistKey}`);
    }
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
