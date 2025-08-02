// Request queue manager to prevent API rate limiting
class RequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private readonly delay: number;

  constructor(delay: number = 1000) {
    this.delay = delay;
  }

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const request = this.queue.shift();
    
    if (request) {
      await request();
      // Wait before processing next request
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    // Process next request
    this.processQueue();
  }

  clear() {
    this.queue = [];
    this.isProcessing = false;
  }
}

// Global request queue instance
export const priceRequestQueue = new RequestQueue(1000); // 1 second delay between requests