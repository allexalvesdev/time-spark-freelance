
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Tag } from '@/types';
import { tagService } from '@/services';
import { useToast } from '@/hooks/use-toast';

// Cache for tag data to reduce API calls
const tagsCache: Record<string, { data: Tag[], timestamp: number }> = {};
const TAG_CACHE_TTL = 30000; // 30 seconds cache TTL
const taskTagsCache: Record<string, { ids: string[], timestamp: number }> = {};

interface TagsContextType {
  tags: Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  loading: boolean;
  addTag: (name: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
  addTagToTask: (taskId: string, tagId: string) => Promise<void>;
  removeTagFromTask: (taskId: string, tagId: string) => Promise<void>;
  getTaskTags: (taskId: string) => Promise<string[]>;
  refreshTags: () => Promise<void>;
}

const TagsContext = createContext<TagsContextType | undefined>(undefined);

export const TagsProvider: React.FC<{ children: ReactNode; userId: string }> = ({ 
  children, 
  userId 
}) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadTags = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Check if we have recent cached data
      const cachedData = tagsCache[userId];
      const now = Date.now();
      
      if (cachedData && (now - cachedData.timestamp < TAG_CACHE_TTL)) {
        setTags(cachedData.data);
        return;
      }
      
      // No valid cache, fetch from server
      const { tags: fetchedTags } = await tagService.loadTags(userId);
      
      // Update cache and state
      tagsCache[userId] = {
        data: fetchedTags,
        timestamp: now
      };
      
      setTags(fetchedTags);
    } catch (error: any) {
      console.error("Error loading tags:", error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tags. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  // Initial load
  useEffect(() => {
    if (userId) {
      loadTags();
    }
  }, [userId, loadTags]);

  const addTag = async (name: string): Promise<Tag> => {
    try {
      const newTag = await tagService.createTag(name, userId);
      
      // Update local state and cache
      setTags(prev => {
        const newTags = [...prev, newTag];
        tagsCache[userId] = {
          data: newTags,
          timestamp: Date.now()
        };
        return newTags;
      });
      
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
      
      // Update local state and cache
      setTags(prev => {
        const newTags = prev.filter(t => t.id !== tagId);
        tagsCache[userId] = {
          data: newTags,
          timestamp: Date.now()
        };
        return newTags;
      });
      
      // Also clear any task tag caches that might have this tag
      Object.keys(taskTagsCache).forEach(key => {
        if (taskTagsCache[key].ids.includes(tagId)) {
          delete taskTagsCache[key];
        }
      });
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
      
      // Invalidate task tags cache for this task
      delete taskTagsCache[taskId];
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
      
      // Invalidate task tags cache for this task
      delete taskTagsCache[taskId];
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
      // Check cache first
      const cachedTaskTags = taskTagsCache[taskId];
      const now = Date.now();
      
      if (cachedTaskTags && (now - cachedTaskTags.timestamp < TAG_CACHE_TTL)) {
        return cachedTaskTags.ids;
      }
      
      // Fetch from server
      const tagIds = await tagService.getTaskTags(taskId);
      
      // Update cache
      taskTagsCache[taskId] = {
        ids: tagIds,
        timestamp: now
      };
      
      return tagIds;
    } catch (error: any) {
      console.error("Error getting task tags:", error);
      toast({
        title: 'Erro',
        description: 'Não foi possível obter as tags da tarefa. Tente novamente.',
        variant: 'destructive',
      });
      return [];
    }
  };

  return (
    <TagsContext.Provider value={{
      tags,
      setTags,
      loading,
      addTag,
      deleteTag,
      addTagToTask,
      removeTagFromTask,
      getTaskTags,
      refreshTags: loadTags
    }}>
      {children}
    </TagsContext.Provider>
  );
};

export const useTagsContext = () => {
  const context = useContext(TagsContext);
  if (context === undefined) {
    throw new Error('useTagsContext must be used within a TagsProvider');
  }
  return context;
};
