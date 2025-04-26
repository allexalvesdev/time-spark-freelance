
import { Project, Task, TimeEntry, ReportData } from './index';

export interface AppState {
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  activeTimeEntry: TimeEntry | null;
  currentProject: Project | null;
  currentTask: Task | null;
}

export interface AppContextType {
  state: AppState;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime' | 'userId'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  startTimer: (taskId: string, projectId: string) => Promise<void>;
  stopTimer: () => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  setCurrentTask: (task: Task | null) => void;
  generateReport: (projectId: string) => ReportData | null;
}
