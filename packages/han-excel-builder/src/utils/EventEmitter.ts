/**
 * Simple EventEmitter implementation
 */

/**
 * Event listener function type
 */
export type EventListener<T = any> = (event: T) => void | Promise<void>;

/**
 * Event listener options
 */
export interface EventListenerOptions {
  /** Whether to execute the listener only once */
  once?: boolean;
  /** Whether to execute the listener asynchronously */
  async?: boolean;
  /** Priority of the listener (higher = executed first) */
  priority?: number;
  /** Whether to stop event propagation */
  stopPropagation?: boolean;
}

/**
 * Event listener registration
 */
export interface EventListenerRegistration {
  /** Event type */
  type: string;
  /** Listener function */
  listener: EventListener;
  /** Listener options */
  options: EventListenerOptions;
  /** Registration ID */
  id: string;
  /** Whether the listener is active */
  active: boolean;
  /** Registration timestamp */
  timestamp: Date;
}

/**
 * EventEmitter class for handling events
 */
export class EventEmitter {
  private listeners: Map<string, EventListenerRegistration[]> = new Map();

  /**
   * Add an event listener
   */
  on<T = any>(type: string, listener: EventListener<T>, options: EventListenerOptions = {}): string {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }

    const registration: EventListenerRegistration = {
      type,
      listener: listener as EventListener,
      options: {
        once: false,
        async: false,
        priority: 0,
        stopPropagation: false,
        ...options
      },
      id: this.generateId(),
      active: true,
      timestamp: new Date()
    };

    this.listeners.get(type)!.push(registration);
    
    // Sort by priority (higher priority first)
    this.listeners.get(type)!.sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0));

    return registration.id;
  }

  /**
   * Add a one-time event listener
   */
  once<T = any>(type: string, listener: EventListener<T>, options: EventListenerOptions = {}): string {
    return this.on(type, listener, { ...options, once: true });
  }

  /**
   * Remove an event listener
   */
  off(type: string, listenerId: string): boolean {
    const listeners = this.listeners.get(type);
    if (!listeners) {
      return false;
    }

    const index = listeners.findIndex(reg => reg.id === listenerId);
    if (index === -1) {
      return false;
    }

    listeners.splice(index, 1);
    return true;
  }

  /**
   * Remove all listeners for an event type
   */
  offAll(type: string): number {
    const listeners = this.listeners.get(type);
    if (!listeners) {
      return 0;
    }

    const count = listeners.length;
    this.listeners.delete(type);
    return count;
  }

  /**
   * Emit an event
   */
  async emit<T = any>(event: T): Promise<void> {
    const type = (event as any).type || 'default';
    const listeners = this.listeners.get(type);
    
    if (!listeners || listeners.length === 0) {
      return;
    }

    const activeListeners = listeners.filter(reg => reg.active);
    
    for (const registration of activeListeners) {
      try {
        if (registration.options.once) {
          registration.active = false;
        }

        if (registration.options.async) {
          await registration.listener(event);
        } else {
          registration.listener(event);
        }

        if (registration.options.stopPropagation) {
          break;
        }
      } catch (error) {
        console.error(`Error in event listener for ${type}:`, error);
      }
    }

    // Clean up inactive listeners
    this.cleanupInactiveListeners(type);
  }

  /**
   * Emit an event synchronously
   */
  emitSync<T = any>(event: T): void {
    const type = (event as any).type || 'default';
    const listeners = this.listeners.get(type);
    
    if (!listeners || listeners.length === 0) {
      return;
    }

    const activeListeners = listeners.filter(reg => reg.active);
    
    for (const registration of activeListeners) {
      try {
        if (registration.options.once) {
          registration.active = false;
        }

        registration.listener(event);

        if (registration.options.stopPropagation) {
          break;
        }
      } catch (error) {
        console.error(`Error in event listener for ${type}:`, error);
      }
    }

    // Clean up inactive listeners
    this.cleanupInactiveListeners(type);
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Get listeners for an event type
   */
  getListeners(type: string): EventListenerRegistration[] {
    return this.listeners.get(type) || [];
  }

  /**
   * Get listener count for an event type
   */
  getListenerCount(type: string): number {
    return this.listeners.get(type)?.length || 0;
  }

  /**
   * Get all registered event types
   */
  getEventTypes(): string[] {
    return Array.from(this.listeners.keys());
  }

  // Private methods

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private cleanupInactiveListeners(type: string): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      const activeListeners = listeners.filter(reg => reg.active);
      if (activeListeners.length !== listeners.length) {
        this.listeners.set(type, activeListeners);
      }
    }
  }
}

