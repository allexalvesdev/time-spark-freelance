
import { useState } from 'react';
import { TimeEntry, Task } from '@/types';
import { timeEntryService, taskService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { formatDuration, calculateEarnings } from '@/utils/dateUtils';

export const useTimerManagement = (userId: string, tasks: Task[] = []) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);
  const { toast } = useToast();

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
      });

      setTimeEntries(prev => Array.isArray(prev) ? [newTimeEntry, ...prev] : [newTimeEntry]);
      setActiveTimeEntry(newTimeEntry);
      
      // Store the active time entry ID globally for persistence
      localStorage.setItem('activeTimeEntryId', newTimeEntry.id);
      localStorage.setItem('activeTaskId', taskId);
      localStorage.setItem('timerStartTime', new Date().getTime().toString());
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o cronômetro. Tente novamente.',
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
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      const updatedTimeEntry: TimeEntry = {
        ...activeTimeEntry,
        endTime,
        duration,
        isRunning: false,
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
          const { tasks: currentTasks } = await taskService.loadTasks();
          const task = currentTasks.find(t => t.id === taskId);
          
          if (task) {
            // Update the task with completed status
            const updatedTask: Task = {
              ...task,
              completed: true,
              actualEndTime: endTime,
              actualStartTime: task.actualStartTime || startTime,
              elapsedTime: (task.elapsedTime || 0) + duration,
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
      
      const taskId = activeTimeEntry.taskId;
      localStorage.removeItem(`timerIsRunning-global-timer-${taskId}`);
      localStorage.removeItem(`timerStartTime-global-timer-${taskId}`);
      localStorage.removeItem(`timerElapsedTime-global-timer-${taskId}`);
    } catch (error: any) {
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
    stopTimer,
    getActiveTaskName,
  };
};
