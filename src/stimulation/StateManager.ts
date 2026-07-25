import type { GaiaState, GaiaSnapshot } from './types';
import { createInitialState } from './initialState';

type Listener = (snap: GaiaSnapshot) => void;

/**
 * StateManager — owns GaiaState and broadcasts immutable snapshots.
 *
 * Engines call `patch(sliceId, partial)` to write ONLY their own slice.
 * After each tick, `commit()` publishes a frozen snapshot to all listeners
 * (the React store subscribes to mirror it into component-readable state).
 *
 * No engine ever holds a reference to another slice; they read the snapshot
 * passed into `update()`.
 */
export class StateManager {
  private state: GaiaState;
  private listeners = new Set<Listener>();

  constructor(initial: GaiaState = createInitialState()) {
    this.state = initial;
  }

  /** Read-only snapshot (shallow clone keeps slices shared — they're replaced, not mutated). */
  snapshot(): GaiaSnapshot {
    return { ...this.state };
  }

  /** Internal: replace an entire slice. Only the orchestrator calls this. */
  replace<K extends keyof GaiaState>(key: K, slice: GaiaState[K]) {
    this.state = { ...this.state, [key]: slice };
  }

  /** Merge a partial into a slice (used for rendering/UI flags). */
  patch<K extends keyof GaiaState>(key: K, partial: Partial<GaiaState[K]>) {
    this.state = {
      ...this.state,
      [key]: { ...this.state[key], ...partial },
    };
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  /** Publish current state to all listeners. */
  commit() {
    const snap = this.snapshot();
    this.listeners.forEach((l) => l(snap));
  }

  /** Direct read for engines (no clone). */
  read(): GaiaState {
    return this.state;
  }

  reset() {
    this.state = createInitialState();
    this.commit();
  }
}
