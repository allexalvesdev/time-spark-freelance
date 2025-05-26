
import { supabase } from '@/integrations/supabase/client';

class BatchTagService {
  private cache = new Map<string, string[]>();
  private pendingRequests = new Map<string, Promise<string[]>>();
  
  async getTaskTags(taskId: string): Promise<string[]> {
    // Return cached result if available
    if (this.cache.has(taskId)) {
      return this.cache.get(taskId)!;
    }
    
    // Return pending request if one exists
    if (this.pendingRequests.has(taskId)) {
      return this.pendingRequests.get(taskId)!;
    }
    
    // Create new request
    const request = this.fetchTaskTags(taskId);
    this.pendingRequests.set(taskId, request);
    
    try {
      const result = await request;
      this.cache.set(taskId, result);
      return result;
    } finally {
      this.pendingRequests.delete(taskId);
    }
  }
  
  async batchGetTaskTags(taskIds: string[]): Promise<Map<string, string[]>> {
    const uncachedIds = taskIds.filter(id => !this.cache.has(id));
    
    if (uncachedIds.length === 0) {
      const result = new Map<string, string[]>();
      taskIds.forEach(id => {
        result.set(id, this.cache.get(id) || []);
      });
      return result;
    }
    
    try {
      const { data, error } = await supabase
        .from('task_tags')
        .select('task_id, tag_id')
        .in('task_id', uncachedIds);
      
      if (error) throw error;
      
      // Group by task_id
      const grouped = new Map<string, string[]>();
      uncachedIds.forEach(id => grouped.set(id, []));
      
      data?.forEach(relation => {
        const tags = grouped.get(relation.task_id) || [];
        tags.push(relation.tag_id);
        grouped.set(relation.task_id, tags);
      });
      
      // Update cache
      grouped.forEach((tags, taskId) => {
        this.cache.set(taskId, tags);
      });
      
      // Return all requested tags
      const result = new Map<string, string[]>();
      taskIds.forEach(id => {
        result.set(id, this.cache.get(id) || []);
      });
      
      return result;
    } catch (error) {
      console.error('Error batch loading task tags:', error);
      throw error;
    }
  }
  
  private async fetchTaskTags(taskId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('task_tags')
      .select('tag_id')
      .eq('task_id', taskId);
    
    if (error) throw error;
    
    return data?.map(relation => relation.tag_id) || [];
  }
  
  clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

export const batchTagService = new BatchTagService();
