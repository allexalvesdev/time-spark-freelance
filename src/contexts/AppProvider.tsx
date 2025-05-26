
import React, { useState, useEffect, ReactNode } from 'react';
import { AppState } from '@/types/app';
import { Project, Task, TimeEntry, Tag } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useTimerManagement } from '@/hooks/useTimerManagement';
import { useTags } from '@/hooks/useTags';
import { projectService, taskService, timeEntryService, tagService } from '@/services';

// Define initial state
const initialState: AppState = {
  projects: [],
  tasks: [],
  timeEntries: [],
  activeTimeEntry: null,
  currentProject: null,
  currentTask: null,
  tags: [],
};

interface AppProviderProps {
  children: ReactNode;
  onStateChange: (state: AppState) => void;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, onStateChange }) => {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(initialState);
  
  const userId = user?.id || '';
  
  // Use custom hooks
  const { 
    projects, 
    setProjects, 
    currentProject,
    setCurrentProject
  } = useProjects(userId);
  
  const { 
    tasks, 
    setTasks, 
    currentTask, 
    setCurrentTask 
  } = useTasks(userId);
  
  const { 
    timeEntries, 
    setTimeEntries, 
    activeTimeEntry, 
    setActiveTimeEntry 
  } = useTimerManagement(userId, tasks);

  const {
    tags,
    setTags
  } = useTags(userId);
  
  // Update centralized state when sub-states change
  useEffect(() => {
    const newState = {
      projects,
      tasks,
      timeEntries,
      activeTimeEntry,
      currentProject,
      currentTask,
      tags,
    };
    setState(newState);
    onStateChange(newState);
  }, [projects, tasks, timeEntries, activeTimeEntry, currentProject, currentTask, tags, onStateChange]);
  
  // Listen for task-completed events to update global task list
  useEffect(() => {
    const handleTaskCompleted = (event: CustomEvent) => {
      const { taskId, updatedTask } = event.detail;
      
      // Update tasks state with the completed task
      setTasks(currentTasks => 
        currentTasks.map(t => t.id === taskId ? updatedTask : t)
      );
    };
    
    window.addEventListener('task-completed', handleTaskCompleted as EventListener);
    
    return () => {
      window.removeEventListener('task-completed', handleTaskCompleted as EventListener);
    };
  }, [setTasks]);
  
  // Load data when user changes
  useEffect(() => {
    if (!user) {
      // Reset state if no user
      const resetState = initialState;
      setState(resetState);
      onStateChange(resetState);
      return;
    }
    
    const loadInitialData = async () => {
      try {
        // Load projects
        const projectsData = await projectService.loadProjects();
        setProjects(projectsData || []);
        
        // Load tasks
        const { tasks: tasksData } = await taskService.loadTasks();
        setTasks(tasksData);
        
        // Load time entries
        const timeEntriesData = await timeEntryService.loadTimeEntries();
        setTimeEntries(timeEntriesData || []);
        setActiveTimeEntry(timeEntriesData.find((entry: TimeEntry) => entry.isRunning) || null);

        // Load tags
        const { tags: tagsData } = await tagService.loadTags(user.id);
        setTags(tagsData);
      } catch (error) {
        // Silent error handling - logs removed for production
      }
    };
    
    loadInitialData();
  }, [user, setProjects, setTasks, setTimeEntries, setActiveTimeEntry, setTags, onStateChange]);

  return <>{children}</>;
};
