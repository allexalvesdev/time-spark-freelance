
import { useCallback } from 'react';
import { Tag } from '@/types';

type TagServicesProps = {
  addStoredTag: (name: string) => Promise<Tag>;
  loadTags: () => Promise<Tag[]>;
  getTaskTags: (taskId: string) => Promise<Tag[]>;
  addStoredTaskTag: (taskId: string, tagId: string) => Promise<void>;
  removeStoredTaskTag: (taskId: string, tagId: string) => Promise<void>;
  user: { id: string } | null;
};

export const useTagServices = ({
  user,
  addStoredTag,
  loadTags,
  getTaskTags,
  addStoredTaskTag,
  removeStoredTaskTag,
}: TagServicesProps) => {
  
  const addTag = useCallback(async (name: string) => {
    const userId = user?.id;
    if (!userId) return { id: '', name, userId: '' };

    try {
      const newTag = await addStoredTag(name);
      return newTag;
    } catch (error) {
      console.error('Error adding tag:', error);
      throw error;
    }
  }, [user, addStoredTag]);

  const getTags = useCallback(async () => {
    try {
      const tags = await loadTags();
      return tags;
    } catch (error) {
      console.error('Error getting tags:', error);
      return [];
    }
  }, [loadTags]);

  const addTaskTag = useCallback(async (taskId: string, tagId: string) => {
    try {
      await addStoredTaskTag(taskId, tagId);
    } catch (error) {
      console.error('Error adding task tag:', error);
      throw error;
    }
  }, [addStoredTaskTag]);

  const removeTaskTag = useCallback(async (taskId: string, tagId: string) => {
    try {
      await removeStoredTaskTag(taskId, tagId);
    } catch (error) {
      console.error('Error removing task tag:', error);
      throw error;
    }
  }, [removeStoredTaskTag]);
  
  return {
    addTag,
    getTags,
    addTaskTag,
    removeTaskTag,
    getTaskTags,
  };
};
