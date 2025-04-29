
import { useState } from 'react';
import { Tag } from '@/types';
import { tagService } from '@/services';
import { useToast } from '@/hooks/use-toast';

export const useTags = (userId: string) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const { toast } = useToast();

  const addTag = async (name: string) => {
    try {
      const newTag = await tagService.createTag(name, userId);
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
        description: 'Não foi possível criar a tag. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const loadTags = async () => {
    try {
      const { tags: loadedTags } = await tagService.loadTags();
      setTags(loadedTags);
      return loadedTags;
    } catch (error: any) {
      console.error('Error loading tags:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tags. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getTaskTags = async (taskId: string) => {
    try {
      const taskTags = await tagService.getTaskTags(taskId);
      return taskTags;
    } catch (error: any) {
      console.error('Error getting task tags:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tags da tarefa. Tente novamente.',
        variant: 'destructive',
      });
      return [];
    }
  };

  const addTaskTag = async (taskId: string, tagId: string) => {
    try {
      await tagService.addTaskTag(taskId, tagId);
    } catch (error: any) {
      console.error('Error adding task tag:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a tag à tarefa. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const removeTaskTag = async (taskId: string, tagId: string) => {
    try {
      await tagService.removeTaskTag(taskId, tagId);
    } catch (error: any) {
      console.error('Error removing task tag:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a tag da tarefa. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    tags,
    setTags,
    addTag,
    loadTags,
    getTaskTags,
    addTaskTag,
    removeTaskTag
  };
};

export default useTags;
