/**
 * Browser-Compatible Worker Base
 * 
 * Provides a base implementation for workers that can run in both Node.js and browser environments.
 */

// Browser-compatible worker interface
interface WorkerMessage {
  type: 'task' | 'result' | 'error' | 'init' | 'status' | 'metrics';
  data: any;
  timestamp: number;
  workerId?: number;
}

interface BrowserWorkerGlobalScope {
  postMessage: (message: any) => void;
  onmessage: ((event: MessageEvent) => void) | null;
  addEventListener: (type: string, listener: (event: MessageEvent) => void) => void;
  removeEventListener: (type: string, listener: (event: MessageEvent) => void) => void;
}

// Use a different name to avoid conflict with global self
declare const workerSelf: BrowserWorkerGlobalScope;

/**
 * Browser-compatible worker base class
 */
abstract class BrowserWorker {
  protected workerId: number;
  protected capabilities: string[] = [];
  
  constructor(workerId: number) {
    this.workerId = workerId;
    this.initialize();
  }
  
  /**
   * Initialize the worker
   */
  protected initialize(): void {
    // Set up message listener
    if (typeof workerSelf !== 'undefined' && workerSelf.addEventListener) {
      workerSelf.addEventListener('message', this.handleMessage.bind(this));
      
      // Send ready message
      this.postMessage({
        type: 'status',
        data: {
          status: 'ready',
          workerId: this.workerId
        },
        timestamp: Date.now(),
        workerId: this.workerId
      });
    }
  }
  
  /**
   * Handle incoming messages
   */
  protected handleMessage(event: MessageEvent): void {
    const message: WorkerMessage = event.data;
    
    switch (message.type) {
      case 'task':
        this.handleTask(message);
        break;
      case 'init':
        this.handleInit(message);
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }
  
  /**
   * Send a message to the main thread
   */
  protected postMessage(message: WorkerMessage): void {
    if (typeof workerSelf !== 'undefined' && workerSelf.postMessage) {
      workerSelf.postMessage(message);
    }
  }
  
  /**
   * Handle initialization
   */
  protected handleInit(message: WorkerMessage): void {
    this.postMessage({
      type: 'status',
      data: {
        status: 'initialized',
        workerId: this.workerId,
        capabilities: this.capabilities
      },
      timestamp: Date.now(),
      workerId: this.workerId
    });
  }
  
  /**
   * Handle task execution - to be implemented by subclasses
   */
  protected abstract handleTask(message: WorkerMessage): Promise<void> | void;
  
  /**
   * Send a successful result
   */
  protected sendResult(taskId: string, data: any, executionTime: number): void {
    this.postMessage({
      type: 'result',
      data: {
        taskId,
        success: true,
        data,
        executionTime,
        workerId: this.workerId
      },
      timestamp: Date.now(),
      workerId: this.workerId
    });
  }
  
  /**
   * Send an error result
   */
  protected sendError(taskId: string, error: string, executionTime: number): void {
    this.postMessage({
      type: 'error',
      data: {
        taskId,
        success: false,
        error,
        executionTime,
        workerId: this.workerId
      },
      timestamp: Date.now(),
      workerId: this.workerId
    });
  }
}

// Export for use in browser environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrowserWorker;
} else if (typeof window !== 'undefined') {
  (window as any).BrowserWorker = BrowserWorker;
}

// Also assign to self for worker context
if (typeof workerSelf !== 'undefined') {
  (workerSelf as any).BrowserWorker = BrowserWorker;
}
