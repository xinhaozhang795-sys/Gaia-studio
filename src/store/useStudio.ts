import { create } from 'zustand';
import type { LocaleCode } from '@/i18n/useT';
import { sim } from '@/simulation';
import type {
  GaiaState, ViewMode, ToolMode, LayerKey, ClockPreset,
} from '@/simulation/types';

// Re-export types that UI components import from this module.
export type { ViewMode, ToolMode, LayerKey, ClockPreset };

/**
 * useStudio — a thin React-facing mirror of the simulation's GaiaState.
 *
 * The simulation is the single source of truth. This store:
 *   • reads `rendering` + `simulation` slices on every committed snapshot
 *   • dispatches UI actions back into the simulation (patch + commit)
 *
 * No scientific computation lives here. Selectors match the previous API
 * so existing UI components work unchanged.
 */

interface StudioState {
  // tools
  tool: ToolMode;
  setTool: (t: ToolMode) => void;

  // view
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;

  autoRotate: boolean;
  setAutoRotate: (v: boolean) => void;

  rotationSpeed: number;
  setRotationSpeed: (v: number) => void;

  // layers
  layers: Record<LayerKey, boolean>;
  toggleLayer: (k: LayerKey) => void;

  // environment
  sunIntensity: number;
  setSunIntensity: (v: number) => void;

  cloudOpacity: number;
  setCloudOpacity: (v: number) => void;

  atmosphereGlow: number;
  setAtmosphereGlow: (v: number) => void;

  starDensity: number;
  setStarDensity: (v: number) => void;

  // time of day — mirrored from simulation; setTimeOfDay nudges the clock
  timeOfDay: number;
  setTimeOfDay: (v: number) => void;

  // simulation clock control
  clockPreset: ClockPreset;
  setClockPreset: (p: ClockPreset) => void;
  simRunning: boolean;
  setSimRunning: (v: boolean) => void;
  simYear: number;
  simDayOfYear: number;

  // camera / diagnostics
  zoom: number;
  setZoom: (v: number) => void;

  focalPoint: [number, number, number];
  setFocalPoint: (p: [number, number, number]) => void;

  // ui
  inspectorOpen: boolean;
  toggleInspector: () => void;

  toolbarOpen: boolean;
  toggleToolbar: () => void;

  controlCenterOpen: boolean;
  toggleControlCenter: () => void;

  // performance
  fps: number;
  setFps: (v: number) => void;

  isMobile: boolean;
  setIsMobile: (v: boolean) => void;

  // i18n
  locale: LocaleCode;
  setLocale: (l: LocaleCode) => void;

  // reset
  resetView: () => void;
  resetViewSignal: number;

  // full snapshot access for the renderer
  gaia: GaiaState;
}

function applyRendering(s: GaiaState['rendering']) {
  set({
    tool: s.tool,
    viewMode: s.viewMode,
    autoRotate: s.autoRotate,
    rotationSpeed: s.rotationSpeed,
    layers: s.layers,
    sunIntensity: s.sunIntensity,
    cloudOpacity: s.cloudOpacity,
    atmosphereGlow: s.atmosphereGlow,
    starDensity: s.starDensity,
  });
}

function applySimulation(s: GaiaState['simulation']) {
  set({
    timeOfDay: s.timeOfDay,
    clockPreset: s.clockPreset,
    simRunning: s.running,
    simYear: s.year,
    simDayOfYear: s.dayOfYear,
  });
}

const store = create<StudioState>((set, get) => ({
  tool: 'orbit',
  setTool: (t) => {
    sim.state.patch('rendering', { tool: t });
    sim.state.commit();
    set({ tool: t });
  },

  viewMode: 'realistic',
  setViewMode: (v) => {
    sim.state.patch('rendering', { viewMode: v });
    sim.state.commit();
    set({ viewMode: v });
  },

  autoRotate: true,
  setAutoRotate: (v) => {
    sim.state.patch('rendering', { autoRotate: v });
    sim.state.commit();
    set({ autoRotate: v });
  },

  rotationSpeed: 1.0,
  setRotationSpeed: (v) => {
    sim.state.patch('rendering', { rotationSpeed: v });
    sim.state.commit();
    set({ rotationSpeed: v });
  },


  layers: {
    atmosphere: true,
    clouds: true,
    stars: true,
    grid: false,
    nightLights: true,
  },
  toggleLayer: (k) => {
    const next = { ...get().layers, [k]: !get().layers[k] };
    sim.state.patch('rendering', { layers: next });
    sim.state.commit();
    set({ layers: next });
  },

  sunIntensity: 1.4,
  setSunIntensity: (v) => {
    sim.state.patch('rendering', { sunIntensity: v });
    sim.state.commit();
    set({ sunIntensity: v });
  },

  cloudOpacity: 0.55,
  setCloudOpacity: (v) => {
    sim.state.patch('rendering', { cloudOpacity: v });
    sim.state.commit();
    set({ cloudOpacity: v });
  },

  atmosphereGlow: 1.0,
  setAtmosphereGlow: (v) => {
    sim.state.patch('rendering', { atmosphereGlow: v });
    sim.state.commit();
    set({ atmosphereGlow: v });
  },

  starDensity: 0.8,
  setStarDensity: (v) => {
    sim.state.patch('rendering', { starDensity: v });
    sim.state.commit();
    set({ starDensity: v });
  },

  timeOfDay: 12.0,
  setTimeOfDay: (v) => {
    // Set the clock's time-of-day directly. The next sim tick picks it up.
    sim.clock.setTimeOfDay(v);
    sim.state.patch('simulation', { timeOfDay: v });
    sim.state.commit();
    set({ timeOfDay: v });
  },

  clockPreset: '24x',
  setClockPreset: (p) => {
    sim.setClockPreset(p);
    set({ clockPreset: p });
  },

  simRunning: true,
  setSimRunning: (v) => {
    sim.setRunning(v);
    set({ simRunning: v });
  },

  simYear: 0,
  simDayOfYear: 80,

  zoom: 3.2,
  setZoom: (v) => set({ zoom: v }),

  focalPoint: [0, 0, 0],
  setFocalPoint: (p) => set({ focalPoint: p }),

  inspectorOpen: true,
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),

  toolbarOpen: true,
  toggleToolbar: () => set((s) => ({ toolbarOpen: !s.toolbarOpen })),

  controlCenterOpen: true,
  toggleControlCenter: () => set((s) => ({ controlCenterOpen: !s.controlCenterOpen })),

  fps: 60,
  setFps: (v) => set({ fps: v }),

  isMobile: false,
  setIsMobile: (v) => set({ isMobile: v }),

  locale: 'zh-CN',
  setLocale: (l) => set({ locale: l }),

  resetViewSignal: 0,
  resetView: () => set((s) => ({ resetViewSignal: s.resetViewSignal + 1, zoom: 3.2, focalPoint: [0, 0, 0] })),

  gaia: sim.state.snapshot(),
}));

// Subscribe to the simulation's committed snapshots and mirror into the store.
sim.state.subscribe((snap) => {
  applyRendering(snap.rendering);
  applySimulation(snap.simulation);
  set({ gaia: snap });
});

function set(partial: Partial<StudioState>) { store.setState(partial); }

export const useStudio = store;
