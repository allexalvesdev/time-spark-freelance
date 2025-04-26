
import React from 'react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface CompleteTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

const CompleteTaskModal: React.FC<CompleteTaskModalProps> = ({ task, isOpen, onClose }) => {
  const { updateTask } = useAppContext();
  const { toast } = useToast();
  const [endTime, setEndTime] = React.useState(new Date().toISOString().slice(0, 16));
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const endTimeDate = new Date(endTime);
    const startTime = task.actualStartTime || task.scheduledStartTime;
    const elapsedTime = Math.floor((endTimeDate.getTime() - startTime.getTime()) / 1000);
    
    const updatedTask: Task = {
      ...task,
      completed: true,
      actualEndTime: endTimeDate,
      elapsedTime: elapsedTime > 0 ? elapsedTime : 0
    };
    
    updateTask(updatedTask);
    
    toast({
      title: "Tarefa concluída",
      description: "A tarefa foi finalizada com sucesso.",
    });
    
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar Tarefa</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="endTime">Horário de Término</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Finalizar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteTaskModal;
