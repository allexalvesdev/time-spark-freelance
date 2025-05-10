import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Clock, 
  CalendarDays, 
  ClipboardList,
  Trash,
  FileText
} from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import TaskItem from '@/components/TaskItem';
import NewTaskForm from '@/components/NewTaskForm';
import Timer from '@/components/Timer';
import { formatCurrency, formatDuration } from '@/utils/dateUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ReportData, Task } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, deleteProject, generateReport, updateTask } = useAppContext();
  const { projects, tasks } = state || { projects: [], tasks: [] };
  const isMobile = useIsMobile();
  
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Verificar se projects existe antes de usar find
  const project = projects && Array.isArray(projects) ? projects.find(p => p.id === projectId) : undefined;
  
  useEffect(() => {
    if (Array.isArray(tasks) && projectId) {
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
        <Button asChild>
          <Link to="/">Voltar para Dashboard</Link>
        </Button>
      </div>
    );
  }
  
  const completedTasks = projectTasks.filter(task => task.completed).length;
  const totalTime = projectTasks.reduce((total, task) => {
    return total + (task.elapsedTime || 0);
  }, 0);
  
  const earnings = (totalTime / 3600) * project.hourlyRate;
  
  const handleDeleteProject = () => {
    if (deleteConfirmation.toLowerCase() !== 'deletar') {
      toast({
        title: 'Erro na confirmação',
        description: 'Digite "deletar" para confirmar a exclusão do projeto.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      deleteProject(project.id);
      
      toast({
        title: 'Projeto excluído',
        description: `O projeto "${project.name}" foi excluído com sucesso.`,
      });
      
      navigate('/');
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Ocorreu um erro ao tentar excluir o projeto. Tente novamente.',
        variant: 'destructive'
      });
    }
    
    setShowDeleteDialog(false);
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground">
              {formatCurrency(project.hourlyRate)}/hora
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList size={20} className="text-timespark-primary" />
              <h3 className="font-medium">Tarefas</h3>
            </div>
            <p className="text-2xl font-bold">{completedTasks}/{projectTasks.length}</p>
            <p className="text-sm text-muted-foreground">tarefas concluídas</p>
          </div>
          
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={20} className="text-timespark-primary" />
              <h3 className="font-medium">Tempo Total</h3>
            </div>
            <p className="text-2xl font-bold">{formatDuration(totalTime)}</p>
            <p className="text-sm text-muted-foreground">horas registradas</p>
          </div>
          
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={20} className="text-timespark-primary" />
              <h3 className="font-medium">Ganhos</h3>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(earnings)}</p>
            <p className="text-sm text-muted-foreground">valor total</p>
          </div>
        </div>
        
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
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
              <h2 className="text-lg font-medium">Lista de Tarefas</h2>
              <Button 
                onClick={() => setShowNewTaskForm(!showNewTaskForm)}
                className="flex items-center gap-2"
                size={isMobile ? "sm" : "default"}
              >
                <Plus size={16} />
                <span>{isMobile ? 'Nova' : 'Nova Tarefa'}</span>
              </Button>
            </div>
            
            {showNewTaskForm && (
              <div className="bg-card rounded-lg border p-4 md:p-6 mb-6">
                <h3 className="text-lg font-medium mb-4">Adicionar Nova Tarefa</h3>
                <NewTaskForm 
                  projectId={project.id} 
                  onSuccess={() => setShowNewTaskForm(false)} 
                />
              </div>
            )}
            
            {projectTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="p-4 bg-muted rounded-full">
                  <ClipboardList size={36} className="text-muted-foreground" />
                </div>
                <h2 className="text-xl font-medium">Nenhuma tarefa</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Adicione tarefas para começar a gerenciar seu tempo e 
                  calcular seus ganhos.
                </p>
                <Button onClick={() => setShowNewTaskForm(true)}>
                  Adicionar Tarefa
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {projectTasks.map((task) => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    project={project} 
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="calendar" className="mt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <CalendarDays size={48} className="text-muted-foreground" />
              <h2 className="text-xl font-medium">Visualização de Agenda</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Esta funcionalidade será implementada em breve. 
                Por enquanto, você pode gerenciar suas tarefas na aba "Tarefas".
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="timer" className="mt-6">
            {projectTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Clock size={48} className="text-muted-foreground" />
                <h2 className="text-xl font-medium">Nenhuma tarefa para cronometrar</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Adicione tarefas para começar a cronometrar seu tempo.
                </p>
                <Button onClick={() => setShowNewTaskForm(true)}>
                  Adicionar Tarefa
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectTasks
                  .filter(task => !task.completed)
                  .map((task) => (
                    <div key={task.id} className="bg-card rounded-lg border overflow-hidden">
                      <div className="p-4 bg-muted">
                        <h3 className="font-medium truncate">{task.name}</h3>
                      </div>
                      <div className="p-4">
                        <Timer 
                          taskId={task.id} 
                          projectId={project.id} 
                          hourlyRate={project.hourlyRate} 
                        />
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="report" className="mt-6">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
              <h2 className="text-lg font-medium">Relatório do Projeto</h2>
              <Button 
                onClick={handleGenerateReport}
                className="flex items-center gap-2"
                size={isMobile ? "sm" : "default"}
              >
                <FileText size={16} />
                <span>Gerar Relatório</span>
              </Button>
            </div>
            
            {!reportData ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <FileText size={48} className="text-muted-foreground" />
                <h2 className="text-xl font-medium">Nenhum relatório gerado</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Clique em "Gerar Relatório" para ver um resumo detalhado do projeto.
                </p>
              </div>
            ) : (
              <div className="bg-card rounded-lg border overflow-hidden">
                <div className="p-4 md:p-6">
                  <h3 className="text-xl font-semibold mb-2">{reportData.projectName}</h3>
                  <p className="text-muted-foreground mb-6">
                    Taxa horária: {formatCurrency(reportData.hourlyRate)}
                  </p>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium mb-4">Tarefas</h4>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className="border-b py-2 px-4 text-left">Nome</th>
                              <th className="border-b py-2 px-4 text-right">Tempo</th>
                              <th className="border-b py-2 px-4 text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.tasks.map((task) => (
                              <tr key={task.id}>
                                <td className="border-b py-3 px-4">{task.name}</td>
                                <td className="border-b py-3 px-4 text-right font-mono">
                                  {formatDuration(task.timeSpent)}
                                </td>
                                <td className="border-b py-3 px-4 text-right">
                                  {formatCurrency(task.earnings)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td className="py-3 px-4 font-semibold">Total</td>
                              <td className="py-3 px-4 text-right font-mono font-semibold">
                                {formatDuration(reportData.totalTime)}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold">
                                {formatCurrency(reportData.totalEarnings)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h4 className="font-medium">Resumo</h4>
                        <p className="text-sm text-muted-foreground">
                          Total de tarefas: {reportData.tasks.length}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total ganho</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(reportData.totalEarnings)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="mt-8">
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash size={16} />
                <span>Excluir Projeto</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tem certeza que deseja excluir?</DialogTitle>
                <DialogDescription>
                  Esta ação não pode ser desfeita. Todos os dados do projeto, incluindo
                  tarefas e registros de tempo, serão permanentemente excluídos.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="mb-2 text-sm text-muted-foreground">
                  Digite <span className="font-bold">deletar</span> para confirmar a exclusão:
                </p>
                <Input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="deletar"
                  className="mb-2"
                  autoComplete="off"
                />
              </div>
              <DialogFooter className="sm:justify-between">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteProject}
                  disabled={deleteConfirmation.toLowerCase() !== 'deletar'}
                >
                  Excluir Permanentemente
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
