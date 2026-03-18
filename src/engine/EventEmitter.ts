/**
 * EventEmitter - Base class for event-driven communication
 * Used by all managers to emit events to the Engine and UI
 */

type EventHandler = (...args: unknown[]) => void;

export class EventEmitter {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * Register an event handler
   */
  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  /**
   * Unregister an event handler
   */
  off(event: string, handler: EventHandler): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.delete(handler);
      if (eventHandlers.size === 0) {
        this.handlers.delete(event);
      }
    }
  }

  /**
   * Emit an event to all handlers
   */
  emit(event: string, ...args: unknown[]): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      for (const handler of eventHandlers) {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      }
    }
  }

  /**
   * Register a one-time event handler
   */
  once(event: string, handler: EventHandler): void {
    const onceHandler: EventHandler = (...args: unknown[]) => {
      handler(...args);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  /**
   * Remove all handlers for an event, or all events if no event specified
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }

  /**
   * Get list of registered events
   */
  eventNames(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get handler count for an event
   */
  listenerCount(event: string): number {
    return this.handlers.get(event)?.size ?? 0;
  }
}
