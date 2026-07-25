import type { Engine, GaiaState, ClockPreset } from './types';
import { StateManager } from './StateManager';
import { SimulationClock } from './SimulationClock';

/**
 * Simulation — the orchestrator.
 *
 * Each tick:
 *   1. Clock advances simulated time from real delta.
 *   2. Engines run in dependency order. Each reads the global state and
 *      writes ONLY its own slice back via the StateManager.
 *   3. StateManager commits a snapshot → React mirrors it.
 *
 * No engine imports another. Coupling is one-way through GaiaState.
 */
export class Simulation {
  readonly state: StateManager;
  readonly clock = new SimulationClock();
  private engines: Engine[] = [];
  private rafId: number | null = null;
  private lastWall = 0;
  private running = false;

  constructor(state?: StateManager) {
    this.state = state ?? new StateManager();
  }

  register(engine: Engine) {
    this.engines.push(engine);
    // keep a stable topological order by dependencies
    this.engines.sort((a, b) => {
      if (a.dependencies.includes(b.id)) return 1;
      if (b.dependencies.includes(a.id)) return -1;
      return 0;
    });
  }

  get enginesList(): readonly Engine[] { return this.engines; }

  setRunning(v: boolean) {
    this.clock.setRunning(v);
    this.state.patch('simulation', { running: v });
  }

  setClockPreset(p: ClockPreset) {
    this.clock.setPreset(p);
    this.state.patch('simulation', { clockPreset: p });
  }

  /** One tick — exposed for testing and for driving from a host loop. */
  step(realDelta: number) {
    const tick = this.clock.tick(realDelta);

    // Update simulation slice from clock
    this.state.patch('simulation', {
      simTime: tick.simTime,
      timeOfDay: tick.timeOfDay,
      dayOfYear: tick.dayOfYear,
      year: tick.year,
      lastDelta: tick.dt,
      tickCount: this.state.read().simulation.tickCount + 1,
    });

    // Run engines in dependency order
    for (const engine of this.engines) {
      const current = this.state.read();
      const out = engine.update(current, tick.dt);
      this.state.replace(engine.id as keyof GaiaState, out as GaiaState[keyof GaiaState]);
    }

    this.state.commit();
  }

  /** Start the internal RAF loop. Rendering can also drive ticks externally. */
  start() {
    if (this.running) return;
    this.running = true;
    this.lastWall = performance.now();
    const loop = () => {
      if (!this.running) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - this.lastWall) / 1000); // clamp to 100ms
      this.lastWall = now;
      this.step(dt);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  get isRunning(): boolean { return this.running; }

  reset() {
    this.clock.reset();
    this.state.reset();
  }
}
