
import { useState, useCallback } from 'react';
import { Tag } from '@/types';
import { tagService } from '@/services';
import { useToast } from '@/hooks/use-toast';

// Utility for retry logic
const retry = async (fn: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

export const useTags = (userId: string) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addTag = useCallback(async (name: string) => {
    if (!name.trim()) {
      return { id: '', name: '', userId: '' };
    }
    
    try {
      setIsLoading(true);
      const newTag = await retry(() => tagService.createTag(name, userId));
      setTags(prev => {
        // Don't add duplicate tags
        if (prev.some(tag => tag.id === newTag.id)) {
          return prev;
        }
        return [...prev, newTag];
      });
      return newTag;
    } catch (error: any) {
      console.error('Error adding tag:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a tag. Usando modo offline.',
        variant: 'destructive',
      });
      
      // Create a temporary tag for UI purposes
      const tempTag = { id: `temp-${Date.now()}`, name, userId };
      setTags(prev => [...prev, tempTag]);
      return tempTag;
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  const loadTags = useCallback(async () => {
    try {
      setIsLoading(true);
      const { tags: loadedTags } = await retry(() => tagService.loadTags());
      setTags(loadedTags);
      return loadedTags;
    } catch (error: any) {
      console.error('Error loading tags:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tags. Usando dados em cache.',
        variant: 'destructive',
      });
      return tags; // Return current state as fallback
    } finally {
      setIsLoading(false);
    }
  }, [toast, tags]);

  const getTaskTags = useCallback(async (taskId: string) => {
    if (!taskId) return [];
    
    try {
      const taskTags = await retry(() => tagService.getTaskTags(taskId));
      return taskTags;
    } catch (error: any) {
      console.error('Error getting task tags:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tags da tarefa.',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  const addTaskTag = useCallback(async (taskId: string, tagId: string) => {
    if (!taskId || !tagId) return;
    
    try {
      await retry(() => tagService.addTaskTag(taskId, tagId));
    } catch (error: any) {
      console.error('Error adding task tag:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a tag à tarefa.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const removeTaskTag = useCallback(async (taskId: string, tagId: string) => {
    if (!taskId || !tagId) return;
    
    try {
      await retry(() => tagService.removeTaskTag(taskId, tagId));
    } catch (error: any) {
      console.error('Error removing task tag:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a tag da tarefa.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return {
    tags,
    setTags,
    isLoading,
    addTag,
    loadTags,
    getTaskTags,
    addTaskTag,
    removeTaskTag
  };
};

export default useTags;
