
export interface Project {
  id: string;
  name: string;
  hourlyRate: number;
  createdAt: Date;
  userId: string;
}

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
  userId: string;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  assigneeId?: string; // ID do membro da equipe responsável pela tarefa
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
    description: string;
    timeSpent: number; // em segundos
    earnings: number; // em reais
    startTime?: Date;
    endTime?: Date;
  }[];
  totalTime: number; // em segundos
  totalEarnings: number; // em reais
}

export interface Tag {
  id: string;
  name: string;
  userId: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userEmail: string;
  name: string;
  role: string;
  createdAt: Date;
  userId?: string; // ID do usuário Supabase associado
  invitationStatus: string; // 'pending', 'accepted', 'expired'
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
}
