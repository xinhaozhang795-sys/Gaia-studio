import type { Engine, GaiaState, EvolutionState } from '../types';

/**
 * EvolutionEngine — species dynamics on ecological timescales.
 * Reads ecology (biomass, niche capacity); writes `evolution`.
 * Logistic speciation, density-dependent extinction.
 * Like geology, meaningful change only emerges at century+ presets.
 */
export class EvolutionEngine implements Engine<EvolutionState> {
  readonly id = 'evolution';
  readonly dependencies = ['ecology'] as const;

  update(state: GaiaState, dt: number): EvolutionState {
    const evo = state.evolution;
    const bio = state.ecology.totalBiomass;

    // Speciation scales with biomass & open niche capacity
    const speciationRate = evo.speciationRate * (bio / 550) * (0.5 + evo.nicheCapacity);
    // Extinction is density-dependent; rises as niche fills
    const extinctionRate = evo.extinctionRate * (0.5 + (1 - evo.nicheCapacity) * 1.5);

    const dN = (speciationRate - extinctionRate) * dt;
    const speciesCount = Math.max(0, evo.speciesCount + dN);

    // Niche slowly fills as species radiate
    const nicheCapacity = Math.min(1, evo.nicheCapacity + speciationRate * dt * 1e-7);

    return {
      ...evo,
      speciesCount,
      speciationRate,
      extinctionRate,
      nicheCapacity,
    };
  }
}
