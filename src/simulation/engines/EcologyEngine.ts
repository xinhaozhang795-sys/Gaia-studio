import type { Engine, GaiaState, EcologyState } from '../types';

/**
 * EcologyEngine — biosphere productivity model.
 * Reads climate (temp), hydrology (water), atmosphere (CO₂); writes `ecology`.
 * NPP follows a temperature × water × CO₂ response; biomass integrates NPP
 * minus a respiration loss.
 */
export class EcologyEngine implements Engine<EcologyState> {
  readonly id = 'ecology';
  readonly dependencies = ['climate', 'hydrology', 'atmosphere'] as const;

  update(state: GaiaState, dt: number): EcologyState {
    const e = state.ecology;
    const T = state.climate.globalMeanTemp;
    const water = state.hydrology.precipitableWater;
    const co2 = state.atmosphere.composition.CO2 ?? 0.00042;

    // Temperature response: optimal ~298 K, falls off on either side
    const tResp = Math.exp(-Math.pow((T - 298) / 15, 2));
    const wResp = Math.min(1, water / 40);
    const co2Resp = 1 + Math.log(co2 / 0.00042) * 0.15;

    const npp = 105 * tResp * wResp * co2Resp;
    const respiration = e.totalBiomass * 0.18 / (365 * 86400); // per-second
    const nppPerSec = npp * 1e15 / (365 * 86400);

    const totalBiomass = Math.max(0, e.totalBiomass + (nppPerSec - respiration) * dt / 1e15);
    const vegetationCover = Math.min(0.6, 0.27 + totalBiomass / 2000);
    const co2Drawdown = npp * 1.15;
    const oceanBioPump = 11 * wResp;

    return {
      ...e,
      netPrimaryProductivity: npp,
      totalBiomass,
      vegetationCover,
      co2Drawdown,
      oceanBioPump,
    };
  }
}
