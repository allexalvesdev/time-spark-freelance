
// Legacy service - replaced by optimizedTagService
// This file is kept for compatibility but will be removed in future versions

import { optimizedTagService } from './optimizedTagService';

class BatchTagService {
  async getTaskTags(taskId: string): Promise<string[]> {
    return optimizedTagService.getTaskTags(taskId);
  }

  async batchGetTaskTags(taskIds: string[]): Promise<Map<string, string[]>> {
    return optimizedTagService.batchGetTaskTags(taskIds);
  }

  clearCache() {
    optimizedTagService.clearCache();
  }
}

export const batchTagService = new BatchTagService();
