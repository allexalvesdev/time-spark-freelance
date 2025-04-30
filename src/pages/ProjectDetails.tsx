
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  CalendarDays, 
  Clock,
  FileText
} from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { ReportData, Task } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import ProjectHeader from '@/components/project/ProjectHeader';
import ProjectStats from '@/components/project/ProjectStats';
import TasksTab from '@/components/project/tabs/TasksTab';
import CalendarTab from '@/components/project/tabs/CalendarTab';
import TimerTab from '@/components/project/tabs/TimerTab';
import ReportTab from '@/components/project/tabs/ReportTab';
import DeleteProjectButton from '@/components/project/DeleteProjectButton';

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, deleteProject, generateReport, updateTask } = useAppContext();
  const { projects, tasks } = state;
  const isMobile = useIsMobile();
  
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  
  const project = projects.find(p => p.id === projectId);
  
  useEffect(() => {
    if (Array.isArray(tasks)) {
      setProjectTasks(tasks.filter(t => t.projectId === projectId));
    }
    
    const handleTaskCompleted = (event: CustomEvent) => {
      const { taskId, updatedTask } = event.detail;
      
      setProjectTasks(currentTasks => 
        currentTasks.map(task => task.id === taskId ? updatedTask : task)
      );
    };
    
    window.addEventListener('task-completed', handleTaskCompleted as EventListener);
    
    return () => {
      window.removeEventListener('task-completed', handleTaskCompleted as EventListener);
    };
  }, [tasks, projectId]);
  
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <h2 className="text-xl font-medium">Projeto não encontrado</h2>
        <p className="text-muted-foreground">
          O projeto que você está procurando não existe ou foi removido.
        </p>
      </div>
    );
  }
  
  const handleDeleteProject = () => {
    deleteProject(project.id);
    
    toast({
      title: 'Projeto excluído',
      description: `O projeto "${project.name}" foi excluído com sucesso.`,
    });
    
    navigate('/');
  };
  
  const handleGenerateReport = () => {
    const report = generateReport(project.id);
    if (report) {
      setReportData(report);
    }
  };
  
  return (
    <div>
      <div className="flex flex-col gap-6">
        <ProjectHeader project={project} />
        
        <ProjectStats project={project} tasks={projectTasks} />
        
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className={`${isMobile ? 'flex w-full overflow-x-auto space-x-1' : ''}`}>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ClipboardList size={16} />
              <span>{isMobile ? '' : 'Tarefas'}</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays size={16} />
              <span>{isMobile ? '' : 'Agenda'}</span>
            </TabsTrigger>
            <TabsTrigger value="timer" className="flex items-center gap-2">
              <Clock size={16} />
              <span>{isMobile ? '' : 'Cronômetro'}</span>
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2">
              <FileText size={16} />
              <span>{isMobile ? '' : 'Relatório'}</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="mt-6">
            <TasksTab project={project} tasks={projectTasks} />
          </TabsContent>
          
          <TabsContent value="calendar" className="mt-6">
            <CalendarTab />
          </TabsContent>
          
          <TabsContent value="timer" className="mt-6">
            <TimerTab 
              project={project} 
              tasks={projectTasks} 
              onShowNewTaskForm={() => setShowNewTaskForm(true)} 
            />
          </TabsContent>
          
          <TabsContent value="report" className="mt-6">
            <ReportTab 
              project={project} 
              reportData={reportData} 
              onGenerateReport={handleGenerateReport} 
            />
          </TabsContent>
        </Tabs>
        
        <div className="mt-8">
          <DeleteProjectButton onDelete={handleDeleteProject} />
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
