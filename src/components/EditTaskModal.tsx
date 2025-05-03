
import React, { useEffect, useState } from 'react';
import { Task } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import { usePlan } from '@/contexts/PlanContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PrioritySelect from '@/components/task/PrioritySelect';
import TagsInput from '@/components/task/TagsInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, isOpen, onClose }) => {
  const { updateTask, getTaskTags, state } = useAppContext();
  const { currentPlan } = usePlan();
  const { toast } = useToast();
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description);
  const [estimatedTime, setEstimatedTime] = useState(task.estimatedTime.toString());
  const [priority, setPriority] = useState<'Baixa' | 'Média' | 'Alta' | 'Urgente'>(task.priority || 'Média');
  const [assigneeId, setAssigneeId] = useState<string | undefined>(task.assigneeId);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Verificar se o usuário tem plano Enterprise
  const isEnterpriseUser = currentPlan === 'enterprise';
  
  // Get team members for all teams
  const allTeamMembers = state.teamMembers;
  
  useEffect(() => {
    if (isOpen) {
      // Reset form state when dialog opens
      setName(task.name);
      setDescription(task.description);
      setEstimatedTime(task.estimatedTime.toString());
      setPriority(task.priority || 'Média');
      setAssigneeId(task.assigneeId);
      
      // Fetch tags associated with this task
      const loadTaskTags = async () => {
        try {
          const tagIds = await getTaskTags(task.id);
          setSelectedTagIds(tagIds);
        } catch (error) {
          console.error('Failed to load task tags:', error);
        }
      };
      
      loadTaskTags();
    }
  }, [task, isOpen, getTaskTags]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const updatedTask: Task = {
        ...task,
        name,
        description,
        estimatedTime: parseInt(estimatedTime),
        priority,
        assigneeId,
      };
      
      await updateTask(updatedTask);
      
      toast({
        title: "Tarefa atualizada",
        description: "A tarefa foi atualizada com sucesso.",
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a tarefa. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Tarefa</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Tarefa</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <PrioritySelect
              value={priority}
              onChange={(value) => setPriority(value)}
            />
          </div>

          {/* Opção para atribuir tarefa a um membro da equipe (apenas para plano Enterprise) */}
          {isEnterpriseUser && allTeamMembers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="assignee">Responsável</Label>
              <Select
                value={assigneeId || ""}
                onValueChange={(value) => setAssigneeId(value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem responsável</SelectItem>
                  {allTeamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tags</Label>
            <TagsInput 
              taskId={task.id}
              selectedTagIds={selectedTagIds}
              onTagsChange={setSelectedTagIds}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="estimatedTime">Tempo Estimado (minutos)</Label>
            <Input
              id="estimatedTime"
              type="number"
              min="1"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              required
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskModal;
