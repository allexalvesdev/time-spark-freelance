
import React, { useState, useEffect } from 'react';
import { Task, Tag } from '@/types';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PrioritySelector } from '@/components/ui/priority-selector';
import { TagInput } from '@/components/ui/tag-input';

interface EditTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, isOpen, onClose }) => {
  const { updateTask, addTag, getTags, getTaskTags, addTaskTag, removeTaskTag } = useAppContext();
  const { toast } = useToast();
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description);
  const [estimatedTime, setEstimatedTime] = useState(task.estimatedTime.toString());
  const [priority, setPriority] = useState(task.priority || 'Medium');
  const [taskTags, setTaskTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load tags when the modal opens
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load all tags
        const allTags = await getTags();
        setTagSuggestions(allTags.map(tag => tag.name));
        
        // Load task tags
        const currentTaskTags = await getTaskTags(task.id);
        setTaskTags(currentTaskTags.map(tag => tag.name));
      } catch (error) {
        console.error("Error loading tags data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isOpen) {
      loadData();
    }
  }, [isOpen, task.id, getTags, getTaskTags]);
  
  // Reset form fields when task changes
  useEffect(() => {
    if (isOpen) {
      setName(task.name);
      setDescription(task.description);
      setEstimatedTime(task.estimatedTime.toString());
      setPriority(task.priority || 'Medium');
    }
  }, [isOpen, task]);
  
  const handleCreateTag = async (tagName: string) => {
    try {
      await addTag(tagName);
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // First, update the task basic info
      const updatedTask: Task = {
        ...task,
        name,
        description,
        estimatedTime: parseInt(estimatedTime),
        priority: priority as 'Low' | 'Medium' | 'High' | 'Urgent',
      };
      
      await updateTask(updatedTask);
      
      // Get current task tags
      const currentTaskTags = await getTaskTags(task.id);
      const currentTagNames = currentTaskTags.map(tag => tag.name);
      
      // Find tags to add (in taskTags but not in currentTagNames)
      const tagsToAdd = taskTags.filter(tagName => !currentTagNames.includes(tagName));
      
      // Find tags to remove (in currentTagNames but not in taskTags)
      const tagsToRemove = currentTagNames.filter(tagName => !taskTags.includes(tagName));
      
      // Add new tags
      for (const tagName of tagsToAdd) {
        const newTag = await addTag(tagName);
        await addTaskTag(task.id, newTag.id);
      }
      
      // Remove tags no longer selected
      for (const tagName of tagsToRemove) {
        const tagToRemove = currentTaskTags.find(tag => tag.name === tagName);
        if (tagToRemove) {
          await removeTaskTag(task.id, tagToRemove.id);
        }
      }
      
      toast({
        title: "Tarefa atualizada",
        description: "A tarefa foi atualizada com sucesso.",
      });
      
      onClose();
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a tarefa. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
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
            <PrioritySelector 
              value={priority as 'Low' | 'Medium' | 'High' | 'Urgent'}
              onChange={(value) => setPriority(value)}
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
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <TagInput
              tags={taskTags}
              setTags={setTaskTags}
              suggestions={tagSuggestions}
              placeholder="Adicione tags..."
              onCreateTag={handleCreateTag}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskModal;
