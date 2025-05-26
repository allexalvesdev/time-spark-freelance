
class BatchTagService {
  private cache = new Map<string, string[]>();
  private batchCache = new Map<string, string[]>();
  private pendingRequests = new Set<string>();
  private batchRequestTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 50; // 50ms delay for batching

  async getTaskTags(taskId: string): Promise<string[]> {
    // Check individual cache first
    if (this.cache.has(taskId)) {
      return this.cache.get(taskId) || [];
    }

    // Check batch cache
    if (this.batchCache.has(taskId)) {
      return this.batchCache.get(taskId) || [];
    }

    // Add to pending and trigger batch request
    this.pendingRequests.add(taskId);
    this.scheduleBatchRequest();

    // Wait for batch completion or return empty array
    return new Promise((resolve) => {
      const checkBatch = () => {
        if (this.batchCache.has(taskId)) {
          resolve(this.batchCache.get(taskId) || []);
        } else if (!this.pendingRequests.has(taskId)) {
          resolve([]);
        } else {
          setTimeout(checkBatch, 10);
        }
      };
      checkBatch();
    });
  }

  async batchGetTaskTags(taskIds: string[]): Promise<Map<string, string[]>> {
    console.log('[BatchTagService] 📦 Batch loading tags for tasks:', taskIds.length);
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    try {
      const { data, error } = await supabase
        .from('task_tags')
        .select('task_id, tag_id')
        .in('task_id', taskIds);

      if (error) throw error;

      const result = new Map<string, string[]>();
      
      // Initialize all tasks with empty arrays
      taskIds.forEach(taskId => {
        result.set(taskId, []);
      });

      // Group tag IDs by task ID
      data?.forEach(item => {
        const existing = result.get(item.task_id) || [];
        existing.push(item.tag_id);
        result.set(item.task_id, existing);
      });

      // Update both caches
      result.forEach((tagIds, taskId) => {
        this.cache.set(taskId, tagIds);
        this.batchCache.set(taskId, tagIds);
      });

      console.log('[BatchTagService] ✅ Batch loaded tags for', result.size, 'tasks');
      return result;
    } catch (error) {
      console.error('[BatchTagService] ❌ Batch load error:', error);
      // Return empty arrays for all requested tasks
      const result = new Map<string, string[]>();
      taskIds.forEach(taskId => {
        result.set(taskId, []);
      });
      return result;
    }
  }

  private scheduleBatchRequest() {
    if (this.batchRequestTimeout) {
      clearTimeout(this.batchRequestTimeout);
    }

    this.batchRequestTimeout = setTimeout(async () => {
      const taskIds = Array.from(this.pendingRequests);
      this.pendingRequests.clear();
      
      if (taskIds.length > 0) {
        await this.batchGetTaskTags(taskIds);
      }
    }, this.BATCH_DELAY);
  }

  clearCache() {
    console.log('[BatchTagService] 🗑️ Clearing all caches');
    this.cache.clear();
    this.batchCache.clear();
    this.pendingRequests.clear();
    
    // Emit event to notify components
    window.dispatchEvent(new CustomEvent('task-tags-modified'));
  }
}

export const batchTagService = new BatchTagService();
