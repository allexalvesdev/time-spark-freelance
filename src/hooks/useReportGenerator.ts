
import { Project, Task, ReportData, ProjectReportData } from '@/types';
import { calculateElapsedTime, calculateEarnings } from '@/utils/dateUtils';

export const useReportGenerator = () => {
  // Função auxiliar para gerar relatório de um único projeto
  const generateProjectReport = (projectId: string, projects: Project[], tasks: Task[]): ProjectReportData | null => {
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
        startTime,
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

  // Função para gerar relatório de múltiplos projetos
  const generateMultiProjectReport = (projectIds: string[], projects: Project[], tasks: Task[]): ReportData | null => {
    const projectReports: ProjectReportData[] = [];
    
    // Gerar relatório para cada projeto selecionado
    for (const projectId of projectIds) {
      const projectReport = generateProjectReport(projectId, projects, tasks);
      if (projectReport) {
        projectReports.push(projectReport);
      }
    }
    
    if (projectReports.length === 0) return null;
    
    // Calcular totais gerais de tempo e ganhos
    const totalTime = projectReports.reduce((sum, report) => sum + report.totalTime, 0);
    const totalEarnings = projectReports.reduce((sum, report) => sum + report.totalEarnings, 0);
    
    return {
      projects: projectReports,
      totalTime,
      totalEarnings
    };
  };

  // Função para gerar relatório de um único projeto (mantida para compatibilidade)
  const generateReport = (projectId: string, projects: Project[], tasks: Task[]): ReportData | null => {
    const projectReport = generateProjectReport(projectId, projects, tasks);
    if (!projectReport) return null;
    
    return {
      projects: [projectReport],
      totalTime: projectReport.totalTime,
      totalEarnings: projectReport.totalEarnings
    };
  };

  return { generateReport, generateMultiProjectReport };
};
