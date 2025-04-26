
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Project, Task, TimeEntry, ReportData } from '../types';
import { calculateElapsedTime, calculateEarnings } from '../utils/dateUtils';

// Tipos para o estado
interface AppState {
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  activeTimeEntry: TimeEntry | null;
  currentProject: Project | null;
  currentTask: Task | null;
}

// Tipos para as ações do reducer
type AppAction =
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'COMPLETE_TASK'; payload: { taskId: string; endTime: Date } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'START_TIMER'; payload: TimeEntry }
  | { type: 'STOP_TIMER'; payload: { id: string; endTime: Date } }
  | { type: 'SET_CURRENT_PROJECT'; payload: Project | null }
  | { type: 'SET_CURRENT_TASK'; payload: Task | null }
  | { type: 'LOAD_DATA'; payload: Partial<AppState> };

// Estado inicial
const initialState: AppState = {
  projects: [],
  tasks: [],
  timeEntries: [],
  activeTimeEntry: null,
  currentProject: null,
  currentTask: null,
};

// Função reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload],
        currentProject: action.payload,
      };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project => 
          project.id === action.payload.id ? action.payload : project
        ),
        currentProject: state.currentProject?.id === action.payload.id 
          ? action.payload 
          : state.currentProject,
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        tasks: state.tasks.filter(task => task.projectId !== action.payload),
        timeEntries: state.timeEntries.filter(entry => entry.projectId !== action.payload),
        currentProject: state.currentProject?.id === action.payload ? null : state.currentProject,
        currentTask: state.currentTask?.projectId === action.payload ? null : state.currentTask,
      };
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
        currentTask: action.payload,
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.id ? action.payload : task
        ),
        currentTask: state.currentTask?.id === action.payload.id 
          ? action.payload 
          : state.currentTask,
      };
    case 'COMPLETE_TASK': {
      const { taskId, endTime } = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      
      if (!task) return state;
      
      const updatedTask: Task = {
        ...task,
        completed: true,
        actualEndTime: endTime,
        elapsedTime: task.actualStartTime 
          ? calculateElapsedTime(task.actualStartTime, endTime)
          : 0
      };
      
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
        currentTask: state.currentTask?.id === taskId ? updatedTask : state.currentTask,
      };
    }
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
        timeEntries: state.timeEntries.filter(entry => entry.taskId !== action.payload),
        currentTask: state.currentTask?.id === action.payload ? null : state.currentTask,
      };
    case 'START_TIMER':
      return {
        ...state,
        timeEntries: [...state.timeEntries, action.payload],
        activeTimeEntry: action.payload,
        tasks: state.tasks.map(task => {
          if (task.id === action.payload.taskId) {
            return {
              ...task,
              actualStartTime: action.payload.startTime,
              completed: false
            };
          }
          return task;
        }),
      };
    case 'STOP_TIMER': {
      const { id, endTime } = action.payload;
      const updatedEntries = state.timeEntries.map(entry => {
        if (entry.id === id) {
          const duration = calculateElapsedTime(entry.startTime, endTime);
          return {
            ...entry,
            endTime,
            duration,
            isRunning: false
          };
        }
        return entry;
      });
      
      return {
        ...state,
        timeEntries: updatedEntries,
        activeTimeEntry: null,
      };
    }
    case 'SET_CURRENT_PROJECT':
      return {
        ...state,
        currentProject: action.payload,
        currentTask: action.payload === null ? null : state.currentTask,
      };
    case 'SET_CURRENT_TASK':
      return {
        ...state,
        currentTask: action.payload,
      };
    case 'LOAD_DATA':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};

// Tipo para o contexto
interface AppContextType {
  state: AppState;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime'>) => void;
  updateTask: (task: Task) => void;
  completeTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  startTimer: (taskId: string, projectId: string) => void;
  stopTimer: () => void;
  setCurrentProject: (project: Project | null) => void;
  setCurrentTask: (task: Task | null) => void;
  generateReport: (projectId: string) => ReportData | null;
}

// Criação do contexto
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider do contexto
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Carregar dados do localStorage quando o componente montar
  useEffect(() => {
    const savedData = localStorage.getItem('timeSparkData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData, (key, value) => {
          // Converter strings de data de volta para objetos Date
          if (key === 'createdAt' || key === 'scheduledStartTime' || 
              key === 'actualStartTime' || key === 'actualEndTime' || 
              key === 'startTime' || key === 'endTime') {
            return value ? new Date(value) : null;
          }
          return value;
        });
        
        dispatch({ type: 'LOAD_DATA', payload: parsedData });
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    }
  }, []);

  // Salvar dados no localStorage quando o estado mudar
  useEffect(() => {
    localStorage.setItem('timeSparkData', JSON.stringify({
      projects: state.projects,
      tasks: state.tasks,
      timeEntries: state.timeEntries,
    }));
  }, [state.projects, state.tasks, state.timeEntries]);

  // Funções de gerenciamento de projetos
  const addProject = (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    dispatch({ type: 'ADD_PROJECT', payload: newProject });
  };

  const updateProject = (project: Project) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: project });
  };

  const deleteProject = (projectId: string) => {
    dispatch({ type: 'DELETE_PROJECT', payload: projectId });
  };

  // Funções de gerenciamento de tarefas
  const addTask = (taskData: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      completed: false,
    };
    dispatch({ type: 'ADD_TASK', payload: newTask });
  };

  const updateTask = (task: Task) => {
    dispatch({ type: 'UPDATE_TASK', payload: task });
  };

  const completeTask = (taskId: string) => {
    dispatch({ 
      type: 'COMPLETE_TASK', 
      payload: { 
        taskId, 
        endTime: new Date() 
      } 
    });
  };

  const deleteTask = (taskId: string) => {
    dispatch({ type: 'DELETE_TASK', payload: taskId });
  };

  // Funções de gerenciamento de tempo
  const startTimer = (taskId: string, projectId: string) => {
    // Se já houver um timer ativo, pare-o primeiro
    if (state.activeTimeEntry) {
      stopTimer();
    }
    
    const newTimeEntry: TimeEntry = {
      id: crypto.randomUUID(),
      taskId,
      projectId,
      startTime: new Date(),
      isRunning: true
    };
    
    dispatch({ type: 'START_TIMER', payload: newTimeEntry });
  };

  const stopTimer = () => {
    if (state.activeTimeEntry) {
      dispatch({
        type: 'STOP_TIMER',
        payload: {
          id: state.activeTimeEntry.id,
          endTime: new Date()
        }
      });
    }
  };

  // Funções de navegação
  const setCurrentProject = (project: Project | null) => {
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });
  };

  const setCurrentTask = (task: Task | null) => {
    dispatch({ type: 'SET_CURRENT_TASK', payload: task });
  };

  // Gerar relatório
  const generateReport = (projectId: string): ReportData | null => {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return null;
    
    const projectTasks = state.tasks.filter(t => t.projectId === projectId);
    const taskReports = projectTasks.map(task => {
      // Calcular tempo total gasto na tarefa
      let timeSpent = 0;
      
      if (task.completed && task.actualStartTime && task.actualEndTime) {
        timeSpent = calculateElapsedTime(task.actualStartTime, task.actualEndTime);
      } else if (task.elapsedTime) {
        timeSpent = task.elapsedTime;
      } else {
        // Somar tempo de todas as entradas de tempo para essa tarefa
        const taskEntries = state.timeEntries.filter(entry => entry.taskId === task.id);
        timeSpent = taskEntries.reduce((total, entry) => {
          if (entry.duration) {
            return total + entry.duration;
          } else if (entry.startTime && entry.endTime) {
            return total + calculateElapsedTime(entry.startTime, entry.endTime);
          }
          return total;
        }, 0);
      }
      
      // Calcular ganhos para essa tarefa
      const earnings = calculateEarnings(timeSpent, project.hourlyRate);
      
      return {
        id: task.id,
        name: task.name,
        timeSpent,
        earnings
      };
    });
    
    // Calcular totais
    const totalTime = taskReports.reduce((sum, task) => sum + task.timeSpent, 0);
    const totalEarnings = taskReports.reduce((sum, task) => sum + task.earnings, 0);
    
    return {
      projectId,
      projectName: project.name,
      hourlyRate: project.hourlyRate,
      tasks: taskReports,
      totalTime,
      totalEarnings
    };
  };

  const contextValue: AppContextType = {
    state,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    completeTask,
    deleteTask,
    startTimer,
    stopTimer,
    setCurrentProject,
    setCurrentTask,
    generateReport
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext deve ser usado dentro de um AppProvider');
  }
  return context;
};
