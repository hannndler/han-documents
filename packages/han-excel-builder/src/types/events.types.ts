import { BuilderEventType, IBuilderEvent } from './builder.types';

/**
 * Event listener function type
 */
export type EventListener = (event: IBuilderEvent) => void;

/**
 * Event emitter interface
 */
export interface IEventEmitter {
  on(event: BuilderEventType, listener: EventListener): void;
  off(event: BuilderEventType, listener: EventListener): void;
  emit(event: BuilderEventType, data?: Record<string, unknown>): void;
  removeAllListeners(event?: BuilderEventType): void;
}

