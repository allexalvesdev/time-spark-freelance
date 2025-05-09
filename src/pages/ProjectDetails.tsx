import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project, Task } from '@/types';
import { projectService, taskService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MoreVertical, Edit, Trash2, CheckCircle, Clock, FileText, Tag as TagIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
} from "@/components/ui/alert-dialog"
import TaskForm from '@/components/TaskForm';
import ReportModal from '@/components/ReportModal';
import { Separator } from "@/components/ui/separator"
import { Tag } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { calculateElapsedTime, formatDuration } from '@/utils/dateUtils';
import { Timer } from "@/components/Timer";
import { GlobalTimer } from "@/components/GlobalTimer";
import { TagSelector } from "@/components/TagSelector";

export const ProjectDetails = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, updateProject, deleteProject, addTask, updateTask, completeTask, deleteTask, generateReport, addTagToTask, removeTagFromTask, getTaskTags } = useAppContext();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false);
  const [selectedTaskForTags, setSelectedTaskForTags] = useState<Task | null>(null);
  const [taskTags, setTaskTags] = useState<string[]>([]);
  const [isGlobalTimerRunning, setIsGlobalTimerRunning] = useState(false);
  const [globalTimerTaskId, setGlobalTimerTaskId] = useState<string | null>(null);
  const [globalTimerStartTime, setGlobalTimerStartTime] = useState<number | null>(null);
  const [globalTimerElapsedTime, setGlobalTimerElapsedTime] = useState<number>(0);

  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      try {
        const fetchedProject = await projectService.getProject(projectId);
        setProject(fetchedProject);
      } catch (error: any) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o projeto. Tente novamente.',
          variant: 'destructive',
        });
      }
    };

    loadProject();
  }, [projectId, toast]);

  useEffect(() => {
    if (!projectId) return;

    // Filter tasks based on the current project ID
    const projectTasks = state.tasks.filter(task => task.projectId === projectId);
    setTasks(projectTasks);
  }, [projectId, state.tasks]);

  const handleProjectUpdate = async (updatedProject: Project) => {
    try {
      if (!project) return;
      await updateProject(updatedProject);
      setProject(updatedProject);
      toast({
        title: 'Sucesso',
        description: 'Projeto atualizado com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o projeto. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleProjectDelete = async () => {
    if (!project) return;
    try {
      await deleteProject(project.id);
      toast({
        title: 'Sucesso',
        description: 'Projeto excluído com sucesso.',
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o projeto. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleTaskCreate = () => {
    setIsTaskFormOpen(true);
    setTaskToEdit(null);
  };

  const handleTaskEdit = (task: Task) => {
    setIsTaskFormOpen(true);
    setTaskToEdit(task);
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast({
        title: 'Sucesso',
        description: 'Tarefa excluída com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a tarefa. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      await completeTask(taskId);
      toast({
        title: 'Sucesso',
        description: 'Tarefa concluída com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível concluir a tarefa. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleTaskFormClose = () => {
    setIsTaskFormOpen(false);
    setTaskToEdit(null);
  };

  const handleTaskFormSubmit = async (taskData: Omit<Task, 'id' | 'userId'>) => {
    try {
      if (!project) return;
      if (taskToEdit) {
        // Editing existing task
        const updatedTask: Task = {
          ...taskToEdit,
          ...taskData,
        };
        await updateTask(updatedTask);
        toast({
          title: 'Sucesso',
          description: 'Tarefa atualizada com sucesso.',
        });
      } else {
        // Creating new task
        await addTask({ ...taskData, projectId: project.id });
        toast({
          title: 'Sucesso',
          description: 'Tarefa criada com sucesso.',
        });
      }
      handleTaskFormClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a tarefa. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateReport = () => {
    if (project) {
      const reportData = generateReport(project.id);
      setReport(reportData);
      setIsReportModalOpen(true);
    }
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
  };

  const handleOpenTagSelector = async (task: Task) => {
    setSelectedTaskForTags(task);
    try {
      const tags = await getTaskTags(task.id);
      setTaskTags(tags);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tags da tarefa. Tente novamente.',
        variant: 'destructive',
      });
      setTaskTags([]);
    }
    setIsTagSelectorOpen(true);
  };

  const handleCloseTagSelector = () => {
    setIsTagSelectorOpen(false);
    setSelectedTaskForTags(null);
    setTaskTags([]);
  };

  const handleTagAddedToTask = async (tagId: string) => {
    if (!selectedTaskForTags) return;
    try {
      await addTagToTask(selectedTaskForTags.id, tagId);
      setTaskTags(prev => [...prev, tagId]);
      toast({
        title: 'Sucesso',
        description: 'Tag adicionada à tarefa com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a tag à tarefa. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleTagRemovedFromTask = async (tagId: string) => {
    if (!selectedTaskForTags) return;
    try {
      await removeTagFromTask(selectedTaskForTags.id, tagId);
      setTaskTags(prev => prev.filter(id => id !== tagId));
      toast({
        title: 'Sucesso',
        description: 'Tag removida da tarefa com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a tag da tarefa. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const getTag = (tagId: string): Tag | undefined => {
    return state.tags.find(tag => tag.id === tagId);
  };

  const handleGlobalTimerStart = (taskId: string) => {
    setGlobalTimerRunning(true);
    setGlobalTimerTaskId(taskId);
    setGlobalTimerStartTime(Date.now());
    setGlobalTimerElapsedTime(0);

    // Store the timer state in localStorage
    localStorage.setItem(`timerIsRunning-global-timer-${taskId}`, 'true');
    localStorage.setItem(`timerStartTime-global-timer-${taskId}`, Date.now().toString());
    localStorage.setItem(`timerElapsedTime-global-timer-${taskId}`, '0');
  };

  const handleGlobalTimerStop = (taskId: string) => {
    setGlobalTimerRunning(false);
    setGlobalTimerTaskId(null);
    setGlobalTimerStartTime(null);

    // Remove the timer state from localStorage
    localStorage.removeItem(`timerIsRunning-global-timer-${taskId}`);
    localStorage.removeItem(`timerStartTime-global-timer-${taskId}`);
    localStorage.removeItem(`timerElapsedTime-global-timer-${taskId}`);
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isGlobalTimerRunning && globalTimerStartTime !== null && globalTimerTaskId) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const elapsedTime = now - globalTimerStartTime;
        setGlobalTimerElapsedTime(prevElapsedTime => prevElapsedTime + elapsedTime);

        // Update the elapsed time in localStorage
        localStorage.setItem(`timerElapsedTime-global-timer-${globalTimerTaskId}`, (globalTimerElapsedTime + elapsedTime).toString());
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isGlobalTimerRunning, globalTimerStartTime, globalTimerElapsedTime, globalTimerTaskId]);

  return (
    <>
      <div className="container mx-auto py-10">
        {project ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold">{project.name}</CardTitle>
              <div>
                <Button onClick={handleGenerateReport}>Gerar Relatório</Button>
              </div>
            </div>
            <Card className="w-[500px]">
              <CardHeader>
                <CardTitle>Editar Projeto</CardTitle>
                <CardDescription>
                  Atualize as informações do seu projeto.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Nome
                    </Label>
                    <Input
                      id="name"
                      defaultValue={project.name}
                      className="col-span-2"
                      onChange={(e) => setProject({ ...project, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="hourlyRate" className="text-right">
                      Taxa Horária
                    </Label>
                    <Input
                      type="number"
                      id="hourlyRate"
                      defaultValue={project.hourlyRate.toString()}
                      className="col-span-2"
                      onChange={(e) => setProject({ ...project, hourlyRate: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Excluir Projeto</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá excluir o projeto permanentemente. Tem certeza que deseja prosseguir?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleProjectDelete}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button onClick={() => handleProjectUpdate(project)}>Atualizar Projeto</Button>
              </CardFooter>
            </Card>

            <Separator className="my-6" />

            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Tarefas</h2>
              <Button onClick={handleTaskCreate}>Adicionar Tarefa</Button>
            </div>

            <ScrollArea>
              <Table>
                <TableCaption>Suas tarefas do projeto.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Tarefa</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Tempo Estimado</TableHead>
                    <TableHead>Tempo Decorrido</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        {task.completed ? (
                          <Badge variant="outline">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Concluída
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="mr-2 h-4 w-4" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{task.name}</TableCell>
                      <TableCell>
                        {task.priority === 'Baixa' && <Badge>Baixa</Badge>}
                        {task.priority === 'Média' && <Badge variant="secondary">Média</Badge>}
                        {task.priority === 'Alta' && <Badge variant="destructive">Alta</Badge>}
                        {task.priority === 'Urgente' && <Badge variant="destructive">Urgente</Badge>}
                      </TableCell>
                      <TableCell>{task.estimatedTime} minutos</TableCell>
                      <TableCell>
                        {task.elapsedTime ? formatDuration(task.elapsedTime) : '00:00:00'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <GlobalTimer taskId={task.id} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleTaskEdit(task)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenTagSelector(task)}>
                                <TagIcon className="mr-2 h-4 w-4" />
                                Gerenciar Tags
                              </DropdownMenuItem>
                              {!task.completed && (
                                <DropdownMenuItem onClick={() => handleTaskComplete(task.id)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Concluir
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleTaskDelete(task.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        ) : (
          <p>Carregando projeto...</p>
        )}
      </div>

      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={handleTaskFormClose}
        onSubmit={handleTaskFormSubmit}
        task={taskToEdit}
      />

      {report && project && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={handleCloseReportModal}
          report={report}
          project={project}
        />
      )}

      {selectedTaskForTags && (
        <TagSelector
          isOpen={isTagSelectorOpen}
          onClose={handleCloseTagSelector}
          taskId={selectedTaskForTags.id}
          selectedTags={taskTags}
          onTagAdded={handleTagAddedToTask}
          onTagRemoved={handleTagRemovedFromTask}
        />
      )}
    </>
  );
};
