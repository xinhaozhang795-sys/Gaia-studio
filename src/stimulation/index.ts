/**
 * simulation/index.ts — the single shared Simulation instance.
 *
 * React components and three.js renderers import `sim` from here.
 * The simulation runs on its own RAF loop, decoupled from rendering.
 */
export * from './types';
export * from './UnitSystem';
export { SimulationClock } from './SimulationClock';
export { StateManager } from './StateManager';
export { Simulation } from './Simulation';
export { createInitialState } from './initialState';

import { Simulation } from './Simulation';
import { PlanetPhysicsEngine } from './engines/PlanetPhysicsEngine';
import { ClimateEngine } from './engines/ClimateEngine';
import { HydrologyEngine } from './engines/HydrologyEngine';
import { GeologyEngine } from './engines/GeologyEngine';
import { EcologyEngine } from './engines/EcologyEngine';
import { EvolutionEngine } from './engines/EvolutionEngine';

const sim = new Simulation();
sim.register(new PlanetPhysicsEngine());
sim.register(new ClimateEngine());
sim.register(new HydrologyEngine());
sim.register(new GeologyEngine());
sim.register(new EcologyEngine());
sim.register(new EvolutionEngine());

/** The global simulation. Start it once on app boot. */
export { sim };
