
import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/types';

export const tagService = {
  async loadTags(userId: string) {
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    
    if (error) throw error;
    
    return { tags: tags?.map(tag => ({
      id: tag.id,
      name: tag.name,
      userId: tag.user_id,
    })) || [] };
  },

  async createTag(name: string, userId: string) {
    const { data, error } = await supabase
      .from('tags')
      .insert([{
        name,
        user_id: userId,
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      userId: data.user_id,
    };
  },

  async deleteTag(tagId: string) {
    // First delete all task-tag relationships
    const { error: taskTagError } = await supabase
      .from('task_tags')
      .delete()
      .eq('tag_id', tagId);
    
    if (taskTagError) throw taskTagError;
    
    // Then delete the tag itself
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId);
    
    if (error) throw error;
  },
  
  async addTagToTask(taskId: string, tagId: string) {
    const { error } = await supabase
      .from('task_tags')
      .insert([{
        task_id: taskId,
        tag_id: tagId,
      }]);
    
    if (error) throw error;
  },
  
  async removeTagFromTask(taskId: string, tagId: string) {
    const { error } = await supabase
      .from('task_tags')
      .delete()
      .eq('task_id', taskId)
      .eq('tag_id', tagId);
    
    if (error) throw error;
  },
  
  async getTaskTags(taskId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('task_tags')
      .select('tag_id')
      .eq('task_id', taskId);
    
    if (error) throw error;
    
    return data?.map(relation => relation.tag_id) || [];
  }
};
