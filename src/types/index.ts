
export interface Project {
  id: string;
  name: string;
  description?: string;
  hourlyRate: number;
  createdAt: Date;
  userId: string;
}

export interface Tag {
  id: string;
  name: string;
  userId: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string;
  estimatedTime: number; // em minutos
  scheduledStartTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  elapsedTime?: number; // em segundos
  completed: boolean;
  priority: TaskPriority;
  userId: string;
  tags?: Tag[];
}

export interface TaskTag {
  id: string;
  taskId: string;
  tagId: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  projectId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // em segundos
  isRunning: boolean;
  userId: string;
}

export interface ReportData {
  projectId: string;
  projectName: string;
  hourlyRate: number;
  tasks: {
    id: string;
    name: string;
    timeSpent: number; // em segundos
    earnings: number; // em reais
  }[];
  totalTime: number; // em segundos
  totalEarnings: number; // em reais
}
