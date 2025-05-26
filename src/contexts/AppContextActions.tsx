
import { Project, Task, ReportData, Tag } from '@/types';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useTimerManagement } from '@/hooks/useTimerManagement';
import { useTags } from '@/hooks/useTags';
import { useReportGenerator } from '@/hooks/useReportGenerator';
import { optimizedTagService } from '@/services/optimizedTagService';

interface UseAppActionsProps {
  userId: string;
  tasks: Task[];
  projects: Project[];
}

export const useAppActions = ({ userId, tasks, projects }: UseAppActionsProps) => {
  const { addProject, updateProject, deleteProject } = useProjects(userId);
  const { addTask, updateTask, completeTask, deleteTask } = useTasks(userId);
  const { startTimer, pauseTimer, resumeTimer, stopTimer, getActiveTaskName } = useTimerManagement(userId, tasks);
  const { addTag, deleteTag, addTagToTask, removeTagFromTask, getTaskTags } = useTags(userId);
  const { generateReport } = useReportGenerator();

  // Report generation function adapted to use context
  const appGenerateReport = (projectId: string): ReportData | null => {
    return generateReport(projectId, projects, tasks);
  };

  // Optimized batch tag loader using the new service
  const batchGetTaskTags = async (taskIds: string[]): Promise<Map<string, string[]>> => {
    try {
      return await optimizedTagService.batchGetTaskTags(taskIds);
    } catch (error) {
      return new Map();
    }
  };

  return {
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    completeTask,
    deleteTask,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    generateReport: appGenerateReport,
    getActiveTaskName,
    addTag,
    deleteTag,
    addTagToTask,
    removeTagFromTask,
    getTaskTags,
    batchGetTaskTags,
  };
};
