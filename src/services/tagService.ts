
import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/types';

export const tagService = {
  async loadTags() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user logged in');
        return [];
      }
      
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error loading tags:', error);
        return [];
      }
      
      return data.map(tag => ({
        id: tag.id,
        name: tag.name,
        userId: tag.user_id
      }));
    } catch (error) {
      console.error('Unexpected error loading tags:', error);
      return [];
    }
  },
  
  async createTag(tag: Omit<Tag, 'id'>) {
    const { data, error } = await supabase
      .from('tags')
      .insert([{ name: tag.name, user_id: tag.userId }])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      userId: data.user_id
    };
  },
  
  async deleteTag(tagId: string) {
    // First, remove all associations with tasks
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
      .insert([{ task_id: taskId, tag_id: tagId }]);
    
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
  
  async getTaskTags(taskId: string) {
    const { data, error } = await supabase
      .from('task_tags')
      .select('tag_id')
      .eq('task_id', taskId);
    
    if (error) throw error;
    
    return data ? data.map(item => item.tag_id) : [];
  }
};
