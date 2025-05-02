
import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/types';

export const tagService = {
  async loadTags(userId: string) {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const tags: Tag[] = data?.map(tag => ({
      id: tag.id,
      name: tag.name,
      userId: tag.user_id,
    })) || [];
    
    return { tags };
  },

  async createTag(name: string, userId: string) {
    const { data, error } = await supabase
      .from('tags')
      .insert([{ name, user_id: userId }])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      userId: data.user_id,
    };
  },

  async deleteTag(id: string) {
    // Primeiro remove associações com tarefas
    const { error: taskTagsError } = await supabase
      .from('task_tags')
      .delete()
      .eq('tag_id', id);
    
    if (taskTagsError) throw taskTagsError;
    
    // Depois remove a tag
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async addTagToTask(taskId: string, tagId: string) {
    // Check if the association already exists to avoid duplicates
    const { data: existingData, error: checkError } = await supabase
      .from('task_tags')
      .select('*')
      .eq('task_id', taskId)
      .eq('tag_id', tagId);
    
    if (checkError) throw checkError;
    
    // Only insert if the association doesn't exist
    if (!existingData || existingData.length === 0) {
      const { error } = await supabase
        .from('task_tags')
        .insert([{ task_id: taskId, tag_id: tagId }]);
      
      if (error) throw error;
    }
  },

  async removeTagFromTask(taskId: string, tagId: string) {
    const { error } = await supabase
      .from('task_tags')
      .delete()
      .eq('task_id', taskId)
      .eq('tag_id', tagId);
    
    if (error) throw error;
  },

  async getTaskTags(taskId: string) {
    const { data, error } = await supabase
      .from('task_tags')
      .select('tag_id')
      .eq('task_id', taskId);
    
    if (error) throw error;
    
    return data.map(item => item.tag_id);
  },
};
