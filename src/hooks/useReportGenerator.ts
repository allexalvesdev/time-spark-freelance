
import { Project, Task, ReportData } from '@/types';
import { calculateElapsedTime, calculateEarnings } from '@/utils/dateUtils';

export const useReportGenerator = () => {
  const generateReport = (projectId: string, projects: Project[], tasks: Task[]): ReportData | null => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;
    
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const taskReports = projectTasks.map(task => {
      let timeSpent = 0;
      
      // Determine start and end times, using scheduled time as fallback
      const startTime = task.actualStartTime || task.scheduledStartTime;
      const endTime = task.actualEndTime;
      
      if (task.completed && startTime && endTime) {
        timeSpent = calculateElapsedTime(startTime, endTime);
      } else if (task.elapsedTime) {
        timeSpent = task.elapsedTime;
      }
      
      const earnings = calculateEarnings(timeSpent, project.hourlyRate);
      
      return {
        id: task.id,
        name: task.name,
        description: task.description,
        timeSpent,
        earnings,
        startTime, // Ensuring we're using the fallback here as well
        endTime
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

  // Nova função para gerar relatórios de múltiplos projetos
  const generateMultipleProjectsReport = (
    projectIds: string[], 
    projects: Project[], 
    tasks: Task[]
  ): { reports: ReportData[], totalTime: number, totalEarnings: number } | null => {
    if (!projectIds.length) return null;

    // Gerar relatórios individuais para cada projeto
    const reports = projectIds
      .map(id => generateReport(id, projects, tasks))
      .filter((report): report is ReportData => report !== null);
    
    if (reports.length === 0) return null;
    
    // Calcular totais gerais
    const totalTime = reports.reduce((sum, report) => sum + report.totalTime, 0);
    const totalEarnings = reports.reduce((sum, report) => sum + report.totalEarnings, 0);
    
    return {
      reports,
      totalTime,
      totalEarnings
    };
  };

  return { generateReport, generateMultipleProjectsReport };
};
