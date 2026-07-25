/**
 * Master translation shape.
 * Every locale must satisfy this interface — TypeScript enforces completeness.
 */
export interface Translation {
  // ── App / boot ────────────────────────────────────────────────────────────
  appName: string;
  appVersion: string;
  bootSubtitle: string;

  // ── Status bar ────────────────────────────────────────────────────────────
  webgl: string;

  // ── Toolbar ───────────────────────────────────────────────────────────────
  collapseToolbar: string;
  expandToolbar: string;
  toolOrbit: string;
  toolPan: string;
  toolMeasure: string;
  autoRotate: string;
  resetView: string;
  toggleInspector: string;

  // ── Control center ────────────────────────────────────────────────────────
  controlCenter: string;
  pause: string;
  play: string;
  collapse: string;
  expand: string;
  hide: string;
  showControls: string;

  // Render mode section
  renderMode: string;
  viewRealistic: string;
  viewTopographic: string;
  viewNight: string;
  viewWireframe: string;

  // Rotation
  rotationSpeed: string;

  // Layers section
  layers: string;
  layerAtmosphere: string;
  layerClouds: string;
  layerStars: string;
  layerGrid: string;
  layerNightLights: string;

  // Environment section
  sunIntensity: string;
  cloudOpacity: string;
  atmosphereGlow: string;
  starDensity: string;

  // Time of day
  timeOfDay: string;
  localTime: string;

  // Simulation clock presets
  simClock: string;
  clock1x: string;
  clock24x: string;
  clock365x: string;
  clock1000x: string;
  simYearLabel: string;
  simDayLabel: string;

  // ── Inspector ─────────────────────────────────────────────────────────────
  inspector: string;
  closeInspector: string;

  // Object section
  sectionObject: string;
  objectName: string;
  objectSubtitle: string;
  statRenderMode: string;
  statActiveLayers: string;

  // Camera section
  sectionCamera: string;
  statDistance: string;
  statAutoRotate: string;
  statRotation: string;
  on: string;
  off: string;

  // Time of day (inspector stat)
  statTimeOfDay: string;

  // Environment section
  sectionEnvironment: string;
  statSunIntensity: string;
  statAtmosphere: string;
  statClouds: string;
  statStarField: string;
  enabled: string;
  disabled: string;

  // Performance section
  sectionPerformance: string;
  statFrameRate: string;

  // Simulation report section
  sectionSimReport: string;
  reportRotation: string;
  reportDayLength: string;
  reportAngularVel: string;
  reportCoriolis: string;
  reportGravityEq: string;
  reportGravityPole: string;
  reportFlattening: string;
  reportSolarConst: string;
  reportAbsorbed: string;
  reportEquilTemp: string;
  reportSurfaceTemp: string;
  reportIceMelt: string;
  reportOceanTend: string;
  reportHadley: string;

  // ── 3-D scene ─────────────────────────────────────────────────────────────
  sunLabel: string;

  // ── View mode display names (used in status bar) ──────────────────────────
  viewModeLabel: Record<string, string>;
}
