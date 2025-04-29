
import { useCallback } from 'react';
import { Project, Task, TimeEntry, Tag } from '@/types';
import { projectService, taskService, timeEntryService, tagService } from '@/services';

type InitialDataLoaderProps = {
  user: { id: string } | null;
  setStoredProjects: (projects: Project[]) => void;
  setStoredTasks: (tasks: Task[]) => void;
  setStoredTimeEntries: (timeEntries: TimeEntry[]) => void;
  setStoredActiveTimeEntry: (timeEntry: TimeEntry | null) => void;
  setTags?: (tags: Tag[]) => void;
  toast: any;
};

export const useInitialDataLoader = ({
  user,
  setStoredProjects,
  setStoredTasks,
  setStoredTimeEntries,
  setStoredActiveTimeEntry,
  toast,
  setTags
}: InitialDataLoaderProps) => {
  
  const loadInitialData = useCallback(async () => {
    if (!user) return;
    
    try {
      const projects = await projectService.loadProjects();
      setStoredProjects(projects);
      
      const { tasks } = await taskService.loadTasks();
      setStoredTasks(tasks);
      
      // Handle different return type possibilities from timeEntryService
      const timeEntriesResult = await timeEntryService.loadTimeEntries();
      
      // Check the structure of the returned data and handle accordingly
      if (Array.isArray(timeEntriesResult)) {
        setStoredTimeEntries(timeEntriesResult);
        // Find any active entry in the array
        const activeEntry = timeEntriesResult.find(entry => entry.isRunning) || null;
        setStoredActiveTimeEntry(activeEntry);
      } else if (typeof timeEntriesResult === 'object' && timeEntriesResult !== null) {
        // If it's returning an object with timeEntries and activeTimeEntry properties
        const { timeEntries = [], activeTimeEntry = null } = timeEntriesResult as {
          timeEntries: TimeEntry[];
          activeTimeEntry: TimeEntry | null;
        };
        setStoredTimeEntries(timeEntries);
        setStoredActiveTimeEntry(activeTimeEntry);
      }

      // Load tags if the setter is provided
      if (setTags) {
        const { tags } = await tagService.loadTags();
        setTags(tags);
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar os dados. Por favor, tente novamente.',
        variant: 'destructive',
      });
    }
  }, [user, setStoredProjects, setStoredTasks, setStoredTimeEntries, setStoredActiveTimeEntry, setTags, toast]);
  
  return { loadInitialData };
};
