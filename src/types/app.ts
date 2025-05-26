
import { Project, Task, TimeEntry, Tag, ReportData } from './index';

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
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'userId'>) => Promise<Project>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => void;
  addTask: (task: Omit<Task, 'id' | 'userId' | 'completed'>) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  startTimer: (taskId: string, projectId: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: (autoComplete?: boolean) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  setCurrentTask: (task: Task | null) => void;
  generateReport: (projectId: string) => ReportData | null;
  getActiveTaskName: () => string | null;
  addTag: (name: string) => Promise<Tag>;
  deleteTag: (tagId: string) => Promise<void>;
  addTagToTask: (taskId: string, tagId: string) => Promise<void>;
  removeTagFromTask: (taskId: string, tagId: string) => Promise<void>;
  getTaskTags: (taskId: string) => Promise<string[]>;
  batchGetTaskTags: (taskIds: string[]) => Promise<Map<string, string[]>>;
}
