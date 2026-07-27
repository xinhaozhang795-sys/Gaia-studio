import type { GaiaSnapshot } from './types';

/**
 * SimulationRecorder — fixed-capacity ring buffer of simulation snapshots.
 *
 * Sprint 6.5.1: stores the most recent N ticks of key climate / atmosphere /
 * ocean / wind / hydrology / season metrics for live charting and CSV export.
 * Memory is bounded — old samples are overwritten, never grown.
 */

export interface Sample {
  tick: number;
  simTime: number;
  temperature: number;   // globalMeanTemp K
  humidity: number;      // %
  windSpeed: number;     // m/s
  cloudCover: number;    // 0..1
  pressure: number;      // Pa
  oceanSST: number;      // K anomaly
  season: number;        // phaseAngle
}

const CAPACITY = 3000;

export class SimulationRecorder {
  private buffer: Sample[] = [];
  private head = 0;
  private count = 0;

  /** Extract a flat sample from a full Gaia snapshot. */
  static sample(snap: GaiaSnapshot): Sample {
    return {
      tick:        snap.simulation.tickCount,
      simTime:     snap.simulation.simTime,
      temperature: snap.climate.globalMeanTemp,
      humidity:    snap.hydrology.humidity,
      windSpeed:   snap.wind.globalWindSpeed,
      cloudCover:  snap.hydrology.cloudCover,
      pressure:    snap.atmosphere.surfacePressure,
      oceanSST:    snap.ocean.seaSurfaceTemperature,
      season:      snap.season.phaseAngle,
    };
  }

  push(snap: GaiaSnapshot) {
    const s = SimulationRecorder.sample(snap);
    if (this.count < CAPACITY) {
      this.buffer.push(s);
      this.count++;
    } else {
      this.buffer[this.head] = s;
      this.head = (this.head + 1) % CAPACITY;
    }
  }

  /** Returns samples in chronological order (oldest first). */
  samples(): Sample[] {
    if (this.count < CAPACITY) return this.buffer.slice();
    return [...this.buffer.slice(this.head), ...this.buffer.slice(0, this.head)];
  }

  get size(): number { return this.count; }
  get capacity(): number { return CAPACITY; }

  clear() {
    this.buffer = [];
    this.head = 0;
    this.count = 0;
  }

  /** Export to CSV string (for future download). */
  toCSV(): string {
    const header = 'tick,simTime,temperature,humidity,windSpeed,cloudCover,pressure,oceanSST,season';
    const rows = this.samples().map((s) =>
      `${s.tick},${s.simTime.toFixed(2)},${s.temperature.toFixed(2)},${s.humidity.toFixed(1)},${s.windSpeed.toFixed(2)},${s.cloudCover.toFixed(4)},${s.pressure.toFixed(0)},${s.oceanSST.toFixed(3)},${s.season.toFixed(4)}`,
    );
    return [header, ...rows].join('\n');
  }
}
