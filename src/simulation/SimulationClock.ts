import { ASTRONOMICAL, SECONDS, presetToScale } from './UnitSystem';
import type { ClockPreset } from './types';

/**
 * SimulationClock — THE ONE AND ONLY source of simulated time.
 *
 * Every animated system reads `simTime` (or `timeOfDay`) from this clock.
 * When `running` is false, `tick()` returns dt=0 — nothing advances.
 * No renderer may advance time on its own.
 */
export interface ClockTick {
  simTime: number;
  dt: number;
  timeOfDay: number;
  dayOfYear: number;
  year: number;
}

export class SimulationClock {
  private _simTime = 0; // seconds since epoch
  private _running = true;
  private _preset: ClockPreset = '24x';

  get running(): boolean { return this._running; }
  get preset(): ClockPreset { return this._preset; }
  get simTime(): number { return this._simTime; }

  setRunning(v: boolean) { this._running = v; }
  setPreset(p: ClockPreset) { this._preset = p; }

  /** Set the clock to an absolute simulated time (seconds). */
  setSimTime(t: number) { this._simTime = t; }

  /** Set the clock from a time-of-day value (hours, 0..24). Preserves the current day. */
  setTimeOfDay(hours: number) {
    const secsPerDay = ASTRONOMICAL.SOLAR_DAY_S;
    const curDay = Math.floor(this._simTime / secsPerDay);
    this._simTime = curDay * secsPerDay + (hours / 24) * secsPerDay;
  }

  /** Advance by a real-time delta (seconds). Returns dt=0 when paused. */
  tick(realDelta: number): ClockTick {
    let dt = 0;
    if (this._running) {
      dt = realDelta * presetToScale(this._preset);
      this._simTime += dt;
    }

    const totalSec = this._simTime;
    const yearLen = SECONDS.perYear;

    // Time of day from solar day
    const intoDay = ((totalSec % ASTRONOMICAL.SOLAR_DAY_S) + ASTRONOMICAL.SOLAR_DAY_S) % ASTRONOMICAL.SOLAR_DAY_S;
    const timeOfDay = (intoDay / ASTRONOMICAL.SOLAR_DAY_S) * 24;

    // Day of year [1..365]
    const dayOfYear = Math.floor(((totalSec % yearLen) + yearLen) % yearLen / SECONDS.perDay) + 1;

    // Year count (integer)
    const year = Math.floor(totalSec / yearLen);

    return { simTime: this._simTime, dt, timeOfDay, dayOfYear, year };
  }

  reset() {
    this._simTime = 0;
  }
}
