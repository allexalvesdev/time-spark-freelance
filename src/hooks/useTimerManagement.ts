
import { useCallback } from 'react';
import { Task, TimeEntry } from '@/types';
import { useTimerCore } from './timer/useTimerCore';
import { useTaskCompletion } from './timer/useTaskCompletion';
import { useTimerDisplay } from './timer/useTimerDisplay';

/**
 * Primary hook for timer management functionality
 * Acts as a composition layer for more specific timer-related hooks
 */
export const useTimerManagement = (userId: string, tasks: Task[] = []) => {
  const {
    timeEntries,
    setTimeEntries,
    activeTimeEntry,
    setActiveTimeEntry,
    startTimeEntry,
    stopTimeEntry
  } = useTimerCore(userId);

  const { completeTask } = useTaskCompletion(tasks);
  const { getActiveTaskName: getTaskNameInternal } = useTimerDisplay(tasks);
  
  // Enhanced start timer that integrates with the timer state system
  const startTimer = useCallback(async (taskId: string, projectId: string) => {
    try {
      console.log('Starting timer for task:', taskId);
      const newTimeEntry = await startTimeEntry(taskId, projectId);
      return newTimeEntry;
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  }, [startTimeEntry]);
  
  // Enhanced stop timer that handles task completion
  const stopTimer = useCallback(async (completeTaskFlag: boolean = false) => {
    try {
      console.log('Stopping timer with completeTaskFlag:', completeTaskFlag);
      
      // Importante: guardar informações relevantes antes de parar
      const entryBeforeStop = activeTimeEntry;
      
      // Parar o timer e obter a entrada finalizada
      const stoppedEntry = await stopTimeEntry();
      
      // Se quisermos completar a tarefa e temos uma entrada válida
      if (stoppedEntry && completeTaskFlag) {
        console.log('Completando tarefa após parar timer:', { 
          taskId: stoppedEntry.taskId, 
          duration: stoppedEntry.duration 
        });
        
        // Completar a tarefa passando a entrada de tempo
        await completeTask(stoppedEntry);
      } 
      // Se o timer foi parado sem uma entrada retornada, mas temos a entrada ativa anterior
      else if (!stoppedEntry && entryBeforeStop && completeTaskFlag) {
        console.log('Usando entrada anterior para completar tarefa:', {
          taskId: entryBeforeStop.taskId
        });
        
        // Tentar completar a tarefa com a entrada que tínhamos antes
        await completeTask({
          ...entryBeforeStop,
          endTime: new Date(),
          isRunning: false
        });
      }
      
      return stoppedEntry;
    } catch (error) {
      console.error('Error stopping timer:', error);
      throw error;
    }
  }, [stopTimeEntry, completeTask, activeTimeEntry]);
  
  // Get active task name wrapper
  const getActiveTaskName = useCallback(() => {
    return getTaskNameInternal(activeTimeEntry);
  }, [getTaskNameInternal, activeTimeEntry]);

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

export default useTimerManagement;
