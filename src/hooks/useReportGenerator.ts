
import { Project, Task, ReportData } from '@/types';
import { calculateElapsedTime, calculateEarnings } from '@/utils/dateUtils';

export const useReportGenerator = () => {
  const generateReport = (projectId: string, projects: Project[], tasks: Task[]): ReportData | null => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;
    
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const taskReports = projectTasks.map(task => {
      let timeSpent = 0;
      
      if (task.completed && task.actualStartTime && task.actualEndTime) {
        timeSpent = calculateElapsedTime(task.actualStartTime, task.actualEndTime);
      } else if (task.elapsedTime) {
        timeSpent = task.elapsedTime;
      }
      
      const earnings = calculateEarnings(timeSpent, project.hourlyRate);
      
      return {
        id: task.id,
        name: task.name,
        timeSpent,
        earnings
      };
    });
    
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

  return { generateReport };
};
