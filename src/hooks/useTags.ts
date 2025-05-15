
import { useState } from 'react';
import { Tag } from '@/types';
import { tagService } from '@/services';
import { useToast } from '@/hooks/use-toast';

export const useTags = (userId: string) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const { toast } = useToast();

  const addTag = async (name: string): Promise<Tag> => {
    try {
      const newTag = await tagService.createTag(name, userId);
      setTags(prev => [...prev, newTag]);
      return newTag;
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a tag. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteTag = async (tagId: string) => {
    try {
      await tagService.deleteTag(tagId);
      setTags(prev => prev.filter(t => t.id !== tagId));
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a tag. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const addTagToTask = async (taskId: string, tagId: string) => {
    try {
      await tagService.addTagToTask(taskId, tagId);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a tag à tarefa. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const removeTagFromTask = async (taskId: string, tagId: string) => {
    try {
      await tagService.removeTagFromTask(taskId, tagId);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a tag da tarefa. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getTaskTags = async (taskId: string): Promise<string[]> => {
    try {
      return await tagService.getTaskTags(taskId);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível obter as tags da tarefa. Tente novamente.',
        variant: 'destructive',
      });
      return [];
    }
  };

  return {
    tags,
    setTags,
    addTag,
    deleteTag,
    addTagToTask,
    removeTagFromTask,
    getTaskTags,
  };
};
