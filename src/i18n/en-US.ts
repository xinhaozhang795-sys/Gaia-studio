import type { Translation } from '@/i18n/types';

const enUS: Translation = {
  // ── App / boot ────────────────────────────────────────────────────────────
  appName:      'Gaia Studio',
  appVersion:   'v1.0',
  bootSubtitle: 'Initializing planetary renderer…',

  // ── Status bar ────────────────────────────────────────────────────────────
  webgl: 'WebGL 2.0',

  // ── Toolbar ───────────────────────────────────────────────────────────────
  collapseToolbar: 'Collapse toolbar',
  expandToolbar:   'Expand toolbar',
  toolOrbit:       'Orbit',
  toolPan:         'Pan',
  toolMeasure:     'Measure',
  autoRotate:      'Auto-rotate',
  resetView:       'Reset view',
  toggleInspector: 'Toggle inspector',

  // ── Control center ────────────────────────────────────────────────────────
  controlCenter: 'Control Center',
  pause:         'Pause',
  play:          'Play',
  collapse:      'Collapse',
  expand:        'Expand',
  hide:          'Hide',
  showControls:  'Show Controls',

  // Render mode
  renderMode:      'Render Mode',
  viewRealistic:   'Realistic',
  viewTopographic: 'Topographic',
  viewNight:       'Night',
  viewWireframe:   'Wireframe',

  // Rotation
  rotationSpeed: 'Rotation Speed',

  // Layers
  layers:          'Layers',
  layerAtmosphere: 'Atmosphere',
  layerClouds:     'Clouds',
  layerStars:      'Star Field',
  layerGrid:       'Coordinate Grid',
  layerNightLights:'City Lights',

  // Environment
  sunIntensity:   'Sun Intensity',
  cloudOpacity:   'Cloud Opacity',
  atmosphereGlow: 'Atmosphere Glow',
  starDensity:    'Star Density',

  // Time of day
  timeOfDay: 'Time',
  localTime: 'Local Time',

  // Simulation clock presets
  simClock: 'Sim Clock',
  clock1x: '1x',
  clock24x: '24x',
  clock365x: '365x',
  clock1000x: '1000x',
  simYearLabel: 'Epoch',
  simDayLabel: 'Day',

  // ── Inspector ─────────────────────────────────────────────────────────────
  inspector:      'Inspector',
  closeInspector: 'Close inspector',

  // Object section
  sectionObject:    'Object',
  objectName:       'Earth',
  objectSubtitle:   'Procedural Sphere · R=6371km',
  statRenderMode:   'Render Mode',
  statActiveLayers: 'Active Layers',

  // Camera section
  sectionCamera:  'Camera',
  statDistance:   'Distance',
  statAutoRotate: 'Auto-Rotate',
  statRotation:   'Rotation',
  on:             'ON',
  off:            'OFF',

  // Time of day (inspector stat)
  statTimeOfDay: 'Time',

  // Environment section
  sectionEnvironment: 'Environment',
  statSunIntensity:   'Sun Intensity',
  statAtmosphere:     'Atmosphere',
  statClouds:         'Clouds',
  statStarField:      'Star Field',
  enabled:            'Enabled',
  disabled:           'Disabled',

  // Performance section
  sectionPerformance: 'Performance',
  statFrameRate:      'Frame Rate',

  // Simulation report section
  sectionSimReport:  'Simulation Report',
  reportRotation:    'Rotation',
  reportDayLength:   'Day Length',
  reportAngularVel:  'Angular Velocity',
  reportCoriolis:    'Coriolis (45°)',
  reportGravityEq:   'Gravity (Eq)',
  reportGravityPole: 'Gravity (Pole)',
  reportFlattening:  'Flattening',
  reportSolarConst:  'Solar Irradiance',
  reportAbsorbed:    'Absorbed Energy',
  reportEquilTemp:   'Equilibrium Temp',
  reportSurfaceTemp: 'Surface Temp',
  reportIceMelt:     'Ice Melt Tendency',
  reportOceanTend:   'Ocean Temp Tendency',
  reportHadley:      'Hadley Cells',

  // ── 3-D scene ─────────────────────────────────────────────────────────────
  sunLabel: 'SOL',

  // ── View mode display names ───────────────────────────────────────────────
  viewModeLabel: {
    realistic:   'Realistic',
    topographic: 'Topographic',
    night:       'Night',
    wireframe:   'Wireframe',
  },
};

export default enUS;
