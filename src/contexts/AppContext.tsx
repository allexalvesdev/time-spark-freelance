
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { AppState, AppContextType } from '@/types/app';
import { Project } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { AppProvider } from './AppProvider';
import { useAppActions } from './AppContextActions';

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

// Create context
export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(initialState);
  
  const userId = user?.id || '';
  
  // Get all actions from the actions hook
  const actions = useAppActions({ 
    userId, 
    tasks: state.tasks, 
    projects: state.projects 
  });
  
  // Function to set current project
  const setCurrentProject = (project: Project | null) => {
    setState(prev => ({ ...prev, currentProject: project }));
  };

  // Function to set current task  
  const setCurrentTask = (task: any) => {
    setState(prev => ({ ...prev, currentTask: task }));
  };
  
  // Group values and functions exposed by context
  const contextValue: AppContextType = {
    state,
    ...actions,
    setCurrentProject,
    setCurrentTask,
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      <AppProvider onStateChange={setState}>
        {children}
      </AppProvider>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
