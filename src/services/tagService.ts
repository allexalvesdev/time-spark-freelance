import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/types';

// Cache for tags to reduce API calls
let tagsCache: Tag[] | null = null;
let lastFetchTime = 0;
const CACHE_EXPIRY = 60000; // 1 minute cache expiry

export const tagService = {
  async loadTags() {
    // Use cache if available and fresh
    const now = Date.now();
    if (tagsCache && (now - lastFetchTime < CACHE_EXPIRY)) {
      return { tags: tagsCache };
    }
    
    try {
      const { data: tagsData, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      const tags = tagsData?.map(tag => ({
        id: tag.id,
        name: tag.name,
        userId: tag.user_id
      })) || [];
      
      // Update cache
      tagsCache = tags;
      lastFetchTime = now;
      
      return { tags };
    } catch (error) {
      console.error('Error loading tags:', error);
      
      // Return cached tags as fallback if available
      if (tagsCache) {
        console.log('Using cached tags due to fetch error');
        return { tags: tagsCache };
      }
      
      // If no cache, return empty array
      return { tags: [] };
    }
  },

  async createTag(name: string, userId: string) {
    // Check cache first
    if (tagsCache) {
      const existingTag = tagsCache.find(tag => 
        tag.name.toLowerCase() === name.toLowerCase() && tag.userId === userId
      );
      if (existingTag) return existingTag;
    }
    
    try {
      // Check if tag already exists
      const { data: existingTag } = await supabase
        .from('tags')
        .select()
        .eq('name', name)
        .eq('user_id', userId)
        .maybeSingle();
      
      // If it exists, return it
      if (existingTag) {
        const tag = {
          id: existingTag.id,
          name: existingTag.name,
          userId: existingTag.user_id
        };
        
        // Update cache
        if (tagsCache) {
          const tagIndex = tagsCache.findIndex(t => t.id === tag.id);
          if (tagIndex === -1) {
            tagsCache.push(tag);
          }
        }
        
        return tag;
      }
      
      // Otherwise create a new tag
      const { data, error } = await supabase
        .from('tags')
        .insert([{ name, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      
      const newTag = {
        id: data.id,
        name: data.name,
        userId: data.user_id,
      };
      
      // Update cache
      if (tagsCache) {
        tagsCache.push(newTag);
      }
      
      return newTag;
    } catch (error) {
      console.error('Error creating tag:', error);
      // Fallback: Return a temporary tag object
      // This will allow UI to continue working, even though it won't be saved
      return {
        id: `temp-${Date.now()}`,
        name,
        userId,
      };
    }
  },

  async deleteTag(tagId: string) {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;
      
      // Update cache if it exists
      if (tagsCache) {
        tagsCache = tagsCache.filter(tag => tag.id !== tagId);
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  },

  async getTaskTags(taskId: string) {
    try {
      const { data, error } = await supabase
        .from('task_tags')
        .select('tag_id, tags(id, name, user_id)')
        .eq('task_id', taskId);

      if (error) throw error;
      
      return data?.map(item => ({
        id: item.tags.id,
        name: item.tags.name,
        userId: item.tags.user_id
      })) || [];
    } catch (error) {
      console.error('Error fetching task tags:', error);
      return [];
    }
  },
  
  async addTaskTag(taskId: string, tagId: string) {
    try {
      const { error } = await supabase
        .from('task_tags')
        .insert([{ task_id: taskId, tag_id: tagId }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding task tag:', error);
      throw error;
    }
  },
  
  async removeTaskTag(taskId: string, tagId: string) {
    try {
      const { error } = await supabase
        .from('task_tags')
        .delete()
        .eq('task_id', taskId)
        .eq('tag_id', tagId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing task tag:', error);
      throw error;
    }
  }
};
