
import { useState } from 'react';
import { TimeEntry, Task } from '@/types';
import { timeEntryService, taskService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { formatDuration, calculateEarnings } from '@/utils/dateUtils';

// PostgreSQL integer max value
const PG_INTEGER_MAX = 2147483647;

export const useTimerManagement = (userId: string, tasks: Task[] = []) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);
  const { toast } = useToast();

  // Helper function to ensure values are within PostgreSQL integer limits
  const getSafeInteger = (value: number): number => {
    return Math.min(value, PG_INTEGER_MAX);
  };

  const startTimer = async (taskId: string, projectId: string) => {
    try {
      if (activeTimeEntry) {
        await stopTimer(false);
      }

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
        pausedTime: pausedTimeSeconds,  // Keep existing paused time, will be updated in useTimerState
      };
      
      await timeEntryService.pauseTimeEntry(activeTimeEntry.id, pausedTimeSeconds);
      
      setTimeEntries(prev => Array.isArray(prev) 
        ? prev.map(entry => entry.id === activeTimeEntry.id ? updatedTimeEntry : entry)
        : [updatedTimeEntry]
      );
      
      setActiveTimeEntry(updatedTimeEntry);
      
      // Update localStorage
      localStorage.setItem('timerIsPaused', 'true');
      localStorage.setItem('timerPausedAt', new Date().getTime().toString());
      
      // Update timer state of the specific task
      const taskId = activeTimeEntry.taskId;
      localStorage.setItem(`timerIsPaused-global-timer-${taskId}`, 'true');
      localStorage.setItem(`timerPausedAt-global-timer-${taskId}`, new Date().getTime().toString());
      
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
  
  const resumeTimer = async () => {
    try {
      if (!activeTimeEntry || !activeTimeEntry.isPaused) return;
      
      // Calculate the additional paused time that needs to be added
      const pausedAt = parseInt(localStorage.getItem(`timerPausedAt-global-timer-${activeTimeEntry.taskId}`) || '0', 10);
      const now = new Date().getTime();
      const additionalPausedTime = getSafeInteger(Math.floor((now - pausedAt) / 1000));
      
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
      localStorage.setItem('timerIsPaused', 'false');
      localStorage.removeItem('timerPausedAt');
      
      // Update timer state of the specific task
      const taskId = activeTimeEntry.taskId;
      localStorage.setItem(`timerIsPaused-global-timer-${taskId}`, 'false');
      localStorage.setItem(`timerPausedTime-global-timer-${taskId}`, totalPausedTime.toString());
      localStorage.removeItem(`timerPausedAt-global-timer-${taskId}`);
      
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

  const stopTimer = async (completeTask: boolean = true) => {
    try {
      if (!activeTimeEntry) return;

      const endTime = new Date();
      const startTime = new Date(activeTimeEntry.startTime);
      let duration = getSafeInteger(Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
      
      // Subtract paused time from the total duration
      if (activeTimeEntry.pausedTime) {
        duration = getSafeInteger(duration - activeTimeEntry.pausedTime);
      }
      
      // If currently paused, calculate additional paused time
      if (activeTimeEntry.isPaused) {
        const pausedAt = parseInt(localStorage.getItem(`timerPausedAt-global-timer-${activeTimeEntry.taskId}`) || '0', 10);
        if (pausedAt > 0) {
          const additionalPausedTime = getSafeInteger(Math.floor((endTime.getTime() - pausedAt) / 1000));
          duration = getSafeInteger(duration - additionalPausedTime);
        }
      }

      const updatedTimeEntry: TimeEntry = {
        ...activeTimeEntry,
        endTime,
        duration,
        isRunning: false,
        isPaused: false,
      };

      await timeEntryService.updateTimeEntry(updatedTimeEntry);

      setTimeEntries(prev => Array.isArray(prev) 
        ? prev.map(entry => entry.id === activeTimeEntry.id ? updatedTimeEntry : entry)
        : [updatedTimeEntry]
      );
      
      // If completeTask is true, mark the task as completed
      if (completeTask) {
        try {
          const taskId = activeTimeEntry.taskId;
          const task = tasks.find(t => t.id === taskId);
          
          if (task) {
            // Use scheduledStartTime as fallback if actualStartTime is not available
            const taskStartTime = task.actualStartTime || task.scheduledStartTime;
            
            // Update the task with completed status - ensure elapsed time is safe
            const updatedTask: Task = {
              ...task,
              completed: true,
              actualEndTime: endTime,
              actualStartTime: taskStartTime, // Use the determined start time
              elapsedTime: getSafeInteger((task.elapsedTime || 0) + duration),
            };
            
            // Update the server first
            await taskService.updateTask(updatedTask);
            
            // After server update, dispatch event to update UI across the app
            window.dispatchEvent(new CustomEvent('task-completed', { 
              detail: { taskId, updatedTask } 
            }));
            
            const timeFormatted = formatDuration(updatedTask.elapsedTime);
            toast({
              title: 'Tarefa concluída',
              description: `Tempo registrado: ${timeFormatted}`,
            });
          }
        } catch (taskError) {
          console.error('Error completing task:', taskError);
          toast({
            title: 'Aviso',
            description: 'O timer foi parado mas não foi possível finalizar a tarefa automaticamente.',
            variant: 'default',
          });
        }
      }

      setActiveTimeEntry(null);
      
      // Clear all timer-related localStorage entries
      localStorage.removeItem('activeTimeEntryId');
      localStorage.removeItem('activeTaskId');
      localStorage.removeItem('timerStartTime');
      localStorage.removeItem('timerIsPaused');
      localStorage.removeItem('timerPausedTime');
      localStorage.removeItem('timerPausedAt');
      
      const taskId = activeTimeEntry.taskId;
      localStorage.removeItem(`timerIsRunning-global-timer-${taskId}`);
      localStorage.removeItem(`timerStartTime-global-timer-${taskId}`);
      localStorage.removeItem(`timerElapsedTime-global-timer-${taskId}`);
      localStorage.removeItem(`timerIsPaused-global-timer-${taskId}`);
      localStorage.removeItem(`timerPausedTime-global-timer-${taskId}`);
      localStorage.removeItem(`timerPausedAt-global-timer-${taskId}`);
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
  
  // Function to get the name of the currently active task
  const getActiveTaskName = (): string | null => {
    if (!activeTimeEntry) return null;
    
    const taskId = activeTimeEntry.taskId;
    const task = tasks.find(t => t.id === taskId);
    return task ? task.name : null;
  };

  return {
    timeEntries,
    setTimeEntries,
    activeTimeEntry,
    setActiveTimeEntry,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    getActiveTaskName,
  };
};
