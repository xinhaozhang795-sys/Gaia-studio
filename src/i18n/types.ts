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

  // Sprint 5 — Season + diurnal + ocean + hydrology report
  sectionSeason: string;
  reportSeason: string;
  reportSeasonProgress: string;
  reportSolarDeclination: string;
  reportDayPhase: string;
  reportDayBlend: string;
  reportGoldenHour: string;

  sectionOcean: string;
  reportOceanTemp: string;
  reportOceanDepth: string;
  reportOceanSalinity: string;
  reportOceanCoverage: string;

  sectionHydrology: string;
  reportIceFraction: string;
  reportCloudCover: string;
  reportCloudDensity: string;
  reportCloudHeight: string;
  reportWindSpeed: string;
  reportWindDirection: string;
  reportPrecipitableWater: string;

  // Sprint 6 — Ocean dynamics panel
  sectionOceanDynamics: string;
  reportOceanCurrentSpeed: string;
  reportOceanCurrentDir: string;
  reportEquatorialCurrent: string;
  reportPolarCurrent: string;
  reportHeatTransport: string;
  reportSST: string;

  // Sprint 6 — Wind panel
  sectionWind: string;
  reportTradeWind: string;
  reportWesterlies: string;
  reportPolarWind: string;
  reportJetStream: string;
  reportMonsoon: string;
  reportGlobalWindSpeed: string;

  // Sprint 6 — Weather panel
  sectionWeather: string;
  reportHumidity: string;
  reportStormIntensity: string;
  reportCloudLifetime: string;
  reportPrecipType: string;
  reportEvaporation: string;
  reportPrecipitation: string;
  reportRiverDischarge: string;

  // Sprint 6 — Cloud panel
  sectionCloud: string;

  // Precipitation type labels
  precipRain: string;
  precipSnow: string;
  precipSleet: string;
  precipNone: string;

  // ── 3-D scene ─────────────────────────────────────────────────────────────
  sunLabel: string;

  // ── View mode display names (used in status bar) ──────────────────────────
  viewModeLabel: Record<string, string>;

  // ── Sprint 6.5.1 — Developer Tools ────────────────────────────────────────
  devTools: string;
  devMonitor: string;
  timeline: string;
  charts: string;

  // Developer monitor
  devFrameTime: string;
  devMemory: string;
  devSimTick: string;
  devSimTime: string;
  devBuildVersion: string;
  devEngineCount: string;
  devEngineTimings: string;
  devTotalTime: string;

  // Timeline
  tlPlay: string;
  tlPause: string;
  tlReset: string;
  tlStep: string;
  tlSpeed: string;
  tlDay: string;
  tlYear: string;
  tlSimTime: string;
  tlSeek: string;
  clock10x: string;
  clock100x: string;

  // Charts
  chartTemperature: string;
  chartHumidity: string;
  chartWind: string;
  chartOcean: string;
  chartPressure: string;
  chartExport: string;
  chartNoData: string;
}
