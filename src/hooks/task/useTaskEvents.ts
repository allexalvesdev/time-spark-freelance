
import { useEffect } from 'react';
import { Task } from '@/types';

interface UseTaskEventsOptions {
  task: Task;
  setDisplaySeconds: (seconds: number) => void;
  setCurrentTask: (task: Task) => void;
}

export const useTaskEvents = ({ task, setDisplaySeconds, setCurrentTask }: UseTaskEventsOptions) => {
  // Listen for immediate timer synchronization events
  useEffect(() => {
    const handleTimerEvent = (event: CustomEvent) => {
      const { taskId, elapsedSeconds } = event.detail;
      
      if (taskId === task.id) {
        if (elapsedSeconds !== undefined) {
          // Use the exact elapsed seconds from the event for perfect sync
          setDisplaySeconds(elapsedSeconds);
        }
      }
    };

    const events = [
      'timer-started',
      'timer-paused', 
      'timer-resumed',
      'timer-stopped',
      'timer-state-loaded'
    ];

    events.forEach(eventType => {
      window.addEventListener(eventType, handleTimerEvent as EventListener);
    });

    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleTimerEvent as EventListener);
      });
    };
  }, [task.id, setDisplaySeconds]);

  // Listen for task completion events
  useEffect(() => {
    const handleTaskCompleted = (event: CustomEvent) => {
      try {
        const { taskId, updatedTask } = event.detail || {};
        if (taskId === task.id && updatedTask) {
          setCurrentTask(updatedTask);
        }
      } catch (error) {
        console.error('Error handling task completed event:', error);
      }
    };
    
    window.addEventListener('task-completed', handleTaskCompleted as EventListener);
    
    return () => {
      window.removeEventListener('task-completed', handleTaskCompleted as EventListener);
    };
  }, [task.id, setCurrentTask]);
};
