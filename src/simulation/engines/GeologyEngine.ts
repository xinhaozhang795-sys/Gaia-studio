import type { Engine, GaiaState, GeologyState } from '../types';

/**
 * GeologyEngine — tectonic + thermal evolution.
 * Reads climate (for CO₂ coupling); writes `geology`.
 * Mantle/core cool radiatively; CO₂ outgassing tracks plate velocity.
 * Long timescales — changes are negligible at day/year scales, visible
 * at century+ presets. This is intentional: it keeps the platform honest.
 */
export class GeologyEngine implements Engine<GeologyState> {
  readonly id = 'geology';
  readonly dependencies = ['climate'] as const;

  update(state: GaiaState, dt: number): GeologyState {
    const g = state.geology;

    // Mantle cooling: Urey ratio ~0.5, e-folding ~2 Gyr
    const mantleTau = 2e9 * 365 * 86400;
    const mantleTemperature = g.mantleTemperature - (g.mantleTemperature - 2500) * (1 - Math.exp(-dt / mantleTau));

    // Core cooling is slower (~4 Gyr)
    const coreTau = 4e9 * 365 * 86400;
    const coreTemperature = g.coreTemperature - (g.coreTemperature - 4000) * (1 - Math.exp(-dt / coreTau));

    // CO₂ outgassing ∝ plate velocity
    const co2Outgassing = g.meanPlateVelocity * 0.055;

    // Magnetic moment decays slowly with core cooling
    const magneticMoment = g.magneticMoment * Math.exp(-dt / (3e9 * 365 * 86400));

    return {
      ...g,
      mantleTemperature,
      coreTemperature,
      co2Outgassing,
      magneticMoment,
    };
  }
}
