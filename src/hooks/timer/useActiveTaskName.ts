
import { TimeEntry, Task } from '@/types';

interface UseActiveTaskNameOptions {
  activeTimeEntry: TimeEntry | null;
  tasks: Task[];
}

export const useActiveTaskName = ({ activeTimeEntry, tasks }: UseActiveTaskNameOptions) => {
  // Function to get the name of the currently active task
  const getActiveTaskName = (): string | null => {
    if (!activeTimeEntry) return null;
    
    const taskId = activeTimeEntry.taskId;
    const task = tasks.find(t => t.id === taskId);
    return task ? task.name : null;
  };

  return { getActiveTaskName };
};
