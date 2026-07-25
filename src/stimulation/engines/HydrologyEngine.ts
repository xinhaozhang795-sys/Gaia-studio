import type { Engine, GaiaState, HydrologyState } from '../types';

/**
 * HydrologyEngine — water-cycle box model.
 * Reads climate (temperature) + ecology (vegetation); writes `hydrology`.
 * Clausius-Clapeyron drives evaporation; vegetation modulates retention.
 */
export class HydrologyEngine implements Engine<HydrologyState> {
  readonly id = 'hydrology';
  readonly dependencies = ['climate', 'ecology'] as const;

  update(state: GaiaState, dt: number): HydrologyState {
    const h = state.hydrology;
    const T = state.climate.globalMeanTemp;
    const veg = state.ecology.vegetationCover;

    // Clausius-Clapeyron: saturation vapour pressure ≈ doubles per +10 K
    const refT = 288;
    const sat = 611 * Math.exp(0.067 * (T - refT)); // Pa
    const evapBase = 3.0 * Math.exp(0.067 * (T - refT));

    // Vegetation retains water → slightly less runoff, more transpiration
    const evaporationRate = evapBase * (0.6 + veg * 0.6);
    const precipitationRate = evaporationRate * (0.92 + 0.06 * Math.sin(state.simulation.dayOfYear / 365 * Math.PI * 2));
    const riverDischarge = precipitationRate * 4e5 * (1 - veg * 0.25);

    // Ice fraction relaxes toward temperature-driven equilibrium.
    // T is in Kelvin; ice grows when below freezing, melts when above.
    const freezingPoint = 273.15;
    const iceEq = Math.max(0, Math.min(0.4, (freezingPoint + 10 - T) / 30));
    const iceFraction = h.iceFraction + (iceEq - h.iceFraction) * (1 - Math.exp(-dt / (5 * 365 * 86400)));

    // Cloud cover loosely follows evaporation
    const cloudEq = Math.min(0.85, 0.4 + evaporationRate * 0.1);
    const cloudCover = h.cloudCover + (cloudEq - h.cloudCover) * (1 - Math.exp(-dt / (30 * 86400)));

    // Precipitable water scales with saturation
    const pw = Math.max(5, sat / 100 * 0.4 + 20);

    return {
      ...h,
      evaporationRate,
      precipitationRate,
      riverDischarge,
      iceFraction,
      cloudCover,
      precipitableWater: pw,
    };
  }
}
