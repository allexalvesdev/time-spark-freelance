
import { Project, Task, TimeEntry, ReportData, Tag } from './index';

export interface AppState {
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  activeTimeEntry: TimeEntry | null;
  currentProject: Project | null;
  currentTask: Task | null;
  tags: Tag[];
}

export interface AppContextType {
  state: AppState;
  addProject: (project: Omit<Project, 'id'>) => Promise<Project>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  completeTask: (taskId: string, duration?: number) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  startTimer: (taskId: string, projectId: string) => Promise<TimeEntry | null>;
  pauseTimer: () => Promise<TimeEntry | null>;
  resumeTimer: () => Promise<TimeEntry | null>;
  stopTimer: (completeTask?: boolean) => Promise<TimeEntry | null>;
  setCurrentProject: (project: Project | null) => void;
  setCurrentTask: (task: Task | null) => void;
  generateReport: (projectId: string) => ReportData | null;
  getActiveTaskName: () => string | null;
  addTag: (name: string) => Promise<string>;
  deleteTag: (id: string) => Promise<void>;
  addTagToTask: (taskId: string, tagId: string) => Promise<void>;
  removeTagFromTask: (taskId: string, tagId: string) => Promise<void>;
  getTaskTags: (taskId: string) => Tag[];
}
