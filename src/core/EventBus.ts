export type GaiaEventPayload = Record<string, unknown>;

export class EventBus {
  private listeners = new Map<string, Set<(payload?: GaiaEventPayload) => void>>();

  on(event: string, listener: (payload?: GaiaEventPayload) => void) {
    const bucket = this.listeners.get(event) ?? new Set();
    bucket.add(listener);
    this.listeners.set(event, bucket);
    return () => this.off(event, listener);
  }

  off(event: string, listener: (payload?: GaiaEventPayload) => void) {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, payload?: GaiaEventPayload) {
    this.listeners.get(event)?.forEach((listener) => listener(payload));
  }
}

export const eventBus = new EventBus();
