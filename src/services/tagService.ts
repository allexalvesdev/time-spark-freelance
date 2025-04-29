import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/types';

export const tagService = {
  async loadTags() {
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
    
    return { tags };
  },

  async createTag(name: string, userId: string) {
    // Check if tag already exists
    const { data: existingTag } = await supabase
      .from('tags')
      .select()
      .eq('name', name)
      .eq('user_id', userId)
      .maybeSingle();
    
    // If it exists, return it
    if (existingTag) {
      return {
        id: existingTag.id,
        name: existingTag.name,
        userId: existingTag.user_id
      };
    }
    
    // Otherwise create a new tag
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

  async deleteTag(tagId: string) {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId);

    if (error) throw error;
  },

  async getTaskTags(taskId: string) {
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
  },
  
  async addTaskTag(taskId: string, tagId: string) {
    const { error } = await supabase
      .from('task_tags')
      .insert([{ task_id: taskId, tag_id: tagId }]);

    if (error) throw error;
  },
  
  async removeTaskTag(taskId: string, tagId: string) {
    const { error } = await supabase
      .from('task_tags')
      .delete()
      .eq('task_id', taskId)
      .eq('tag_id', tagId);

    if (error) throw error;
  }
};
