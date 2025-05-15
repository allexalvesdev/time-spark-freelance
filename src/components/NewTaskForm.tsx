
import React, { useState, useEffect } from 'react';
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Project, Task, Tag } from '@/types';
import { projectService, taskService } from '@/services';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import TagsInput from './task/TagsInput';

interface NewTaskFormProps {
  open: boolean;
  handleClose: () => void;
  projects: Project[];
  onTaskCreated: (task: Task) => void;
}

const NewTaskForm: React.FC<NewTaskFormProps> = ({ open, handleClose, projects, onTaskCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [scheduledStartTime, setScheduledStartTime] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<'Baixa' | 'Média' | 'Alta' | 'Urgente'>('Baixa');
  const [selectedProject, setSelectedProject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { addTask, state, addTagToTask } = useAppContext();
  const { tags } = state;

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects, selectedProject]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newTask = await addTask({
        projectId: selectedProject,
        name,
        description,
        estimatedTime: parseFloat(estimatedTime),
        scheduledStartTime: scheduledStartTime,
        priority,
      });

      // Add tags to task
      if (selectedTagIds.length > 0) {
        for (const tagId of selectedTagIds) {
          await addTagToTask(newTask.id, tagId);
        }
      }

      onTaskCreated(newTask);
      handleClose();

      toast({
        title: 'Tarefa criada',
        description: 'Nova tarefa adicionada com sucesso.',
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a tarefa. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagsChange = (tagIds: string[]) => {
    setSelectedTagIds(tagIds);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Nova Tarefa</AlertDialogTitle>
          <AlertDialogDescription>
            Adicione uma nova tarefa ao seu projeto.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descrição
            </Label>
            <Input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="estimatedTime" className="text-right">
              Tempo Estimado
            </Label>
            <Input type="number" id="estimatedTime" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="scheduledStartTime" className="text-right">
              Data de Início
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] pl-3 text-left font-normal",
                    !scheduledStartTime && "text-muted-foreground"
                  )}
                >
                  {scheduledStartTime ? (
                    format(scheduledStartTime, "PPP")
                  ) : (
                    <span>Escolha uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledStartTime}
                  onSelect={setScheduledStartTime}
                  disabled={(date) =>
                    date < new Date()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">
              Prioridade
            </Label>
            <Select onValueChange={(value: string) => setPriority(value as 'Baixa' | 'Média' | 'Alta' | 'Urgente')} defaultValue={priority}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Baixa">Baixa</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project" className="text-right">
              Projeto
            </Label>
            <Select onValueChange={setSelectedProject} defaultValue={selectedProject}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="tags" className="text-right">
              Tags
            </Label>
            <div className="col-span-3">
              <TagsInput 
                taskId=""
                selectedTagIds={selectedTagIds}
                onTagsChange={handleTagsChange}
              />
            </div>
          </div>
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button type="submit" disabled={isSubmitting} onClick={(e) => handleSubmit(e as any)}>
            {isSubmitting ? 'Criando...' : 'Criar'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default NewTaskForm;
