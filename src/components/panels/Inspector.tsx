import { motion, AnimatePresence } from 'framer-motion';
import {
  Info,
  Camera,
  Cpu,
  Activity,
  Crosshair,
  PanelRightClose,
  Globe2,
  Zap,
  Gauge,
  FlaskConical,
  RotateCw,
  Sun,
  Thermometer,
  Waves,
  Snowflake,
  Wind,
  Clock,
  Droplets,
  Cloud,
  Navigation,
  Calendar,
  Sunrise,
  CloudRain,
  CloudSnow,
  Tornado,
  Hourglass,
  Terminal,
} from 'lucide-react';
import { GlassPanel, SectionLabel } from '@/components/ui/Glass';
import { useStudio } from '@/store/useStudio';
import { useT } from '@/i18n';
import { DeveloperMonitor } from '@/components/dev/DeveloperMonitor';
import { Timeline } from '@/components/dev/Timeline';
import { Charts } from '@/components/dev/Charts';

function StatRow({ icon: Icon, label, value, accent }: {
  icon: typeof Info;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/5">
      <div className="flex items-center gap-2.5">
        <Icon size={14} strokeWidth={1.8} className="text-gaia-100/60" />
        <span className="text-[12px] text-gaia-50/70">{label}</span>
      </div>
      <span className={`font-mono text-[12px] ${accent ?? 'text-gaia-50/90'}`}>{value}</span>
    </div>
  );
}

const SEASON_COLORS: Record<string, string> = {
  spring: 'text-success',
  summer: 'text-warning',
  autumn: 'text-accent-300',
  winter: 'text-info',
};

export function Inspector() {
  const t              = useT();
  const open           = useStudio((s) => s.inspectorOpen);
  const toggleInspector = useStudio((s) => s.toggleInspector);
  const zoom           = useStudio((s) => s.zoom);
  const fps            = useStudio((s) => s.fps);
  const viewMode       = useStudio((s) => s.viewMode);
  const autoRotate     = useStudio((s) => s.autoRotate);
  const rotationSpeed  = useStudio((s) => s.rotationSpeed);
  const sunIntensity   = useStudio((s) => s.sunIntensity);
  const timeOfDay      = useStudio((s) => s.timeOfDay);
  const layers         = useStudio((s) => s.layers);
  const gaia           = useStudio((s) => s.gaia);
  const devMode        = useStudio((s) => s.devMode);
  const toggleDevMode  = useStudio((s) => s.toggleDevMode);

  const precipTypeLabel = {
    rain:  t.precipRain,
    snow:  t.precipSnow,
    sleet: t.precipSleet,
    none:  t.precipNone,
  }[gaia.hydrology.precipitationType];

  const activeLayers = Object.entries(layers).filter(([, v]) => v).length;
  const viewLabel    = t.viewModeLabel[viewMode] ?? viewMode;
  const timeLabel    = (() => {
    const h = Math.floor(timeOfDay) % 24;
    const m = Math.round((timeOfDay - Math.floor(timeOfDay)) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  })();

  const seasonLabel = t.reportSeason;
  const seasonColor = SEASON_COLORS[gaia.season.season] ?? 'text-gaia-50/90';

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          className="glass-strong scroll-thin fixed right-4 top-16 z-30 max-h-[calc(100vh-7rem)] w-72 overflow-y-auto rounded-2xl p-3"
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-accent-300" />
              <span className="text-[13px] font-semibold tracking-tight text-white">{t.inspector}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleDevMode}
                className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                  devMode
                    ? 'border-accent-400/50 bg-accent-400/20 text-accent-300'
                    : 'border-white/8 bg-white/5 text-gaia-50/70 hover:bg-white/10'
                }`}
                aria-label={t.devTools}
                title={t.devTools}
              >
                <Terminal size={14} />
              </button>
              <button
                onClick={toggleInspector}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-gaia-50/70 transition-colors hover:bg-white/10"
                aria-label={t.closeInspector}
              >
                <PanelRightClose size={14} />
              </button>
            </div>
          </div>

          {/* Object */}
          <GlassPanel className="mb-3 p-3">
            <SectionLabel>{t.sectionObject}</SectionLabel>
            <div className="mb-2 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ocean/40 to-land/30">
                <Globe2 size={18} className="text-accent-200" />
              </div>
              <div>
                <div className="text-[13px] font-medium text-white">{t.objectName}</div>
                <div className="text-[10px] text-gaia-100/50">{t.objectSubtitle}</div>
              </div>
            </div>
            <StatRow icon={Gauge} label={t.statRenderMode}   value={viewLabel} />
            <StatRow icon={Zap}   label={t.statActiveLayers} value={`${activeLayers} / 5`} accent="text-success" />
          </GlassPanel>

          {/* Camera */}
          <GlassPanel className="mb-3 p-3">
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <Camera size={11} /> {t.sectionCamera}
              </span>
            </SectionLabel>
            <StatRow icon={Crosshair} label={t.statDistance}   value={`${zoom.toFixed(2)} AU`} accent="text-accent-300" />
            <StatRow icon={Activity}  label={t.statAutoRotate} value={autoRotate ? t.on : t.off} accent={autoRotate ? 'text-success' : 'text-gaia-100/50'} />
            <StatRow icon={Activity}  label={t.statRotation}   value={`${(rotationSpeed * 60).toFixed(0)}°/s`} />
            <StatRow icon={Gauge}      label={t.statTimeOfDay}   value={timeLabel} accent="text-accent-300" />
          </GlassPanel>

          {/* Environment */}
          <GlassPanel className="mb-3 p-3">
            <SectionLabel>{t.sectionEnvironment}</SectionLabel>
            <StatRow icon={Zap}    label={t.statSunIntensity} value={sunIntensity.toFixed(2)} />
            <StatRow icon={Globe2} label={t.statAtmosphere}   value={layers.atmosphere ? t.enabled : t.disabled} accent={layers.atmosphere ? 'text-success' : 'text-gaia-100/50'} />
            <StatRow icon={Globe2} label={t.statClouds}       value={layers.clouds     ? t.enabled : t.disabled} accent={layers.clouds     ? 'text-success' : 'text-gaia-100/50'} />
            <StatRow icon={Globe2} label={t.statStarField}    value={layers.stars      ? t.enabled : t.disabled} accent={layers.stars      ? 'text-success' : 'text-gaia-100/50'} />
          </GlassPanel>

          {/* Simulation Report — Rotation */}
          <GlassPanel className="mb-3 p-3">
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <FlaskConical size={11} /> {t.sectionSimReport}
              </span>
            </SectionLabel>

            <div className="mb-2 mt-1 text-[9px] font-semibold uppercase tracking-wider text-accent-300/70">
              <span className="inline-flex items-center gap-1"><RotateCw size={9} /> {t.reportRotation}</span>
            </div>
            <StatRow icon={Clock}     label={t.reportDayLength}   value={`${gaia.planet.dayLengthHours.toFixed(1)} h`} />
            <StatRow icon={RotateCw}   label={t.reportAngularVel}  value={`${(gaia.planet.angularVelocity * 1e5).toExponential(2)} ×10⁻⁵ rad/s`} />
            <StatRow icon={Wind}       label={t.reportCoriolis}    value={`${(gaia.planet.coriolis45 * 1e5).toExponential(2)} ×10⁻⁵ s⁻¹`} />
            <StatRow icon={Gauge}      label={t.reportGravityEq}   value={`${gaia.planet.gravityEquator.toFixed(3)} m/s²`} />
            <StatRow icon={Gauge}      label={t.reportGravityPole} value={`${gaia.planet.gravityPole.toFixed(3)} m/s²`} />
            <StatRow icon={Globe2}     label={t.reportFlattening}  value={`${(gaia.planet.flattening * 1000).toFixed(2)} ‰`} accent="text-accent-200" />
          </GlassPanel>

          {/* Season — new in Sprint 5 */}
          <GlassPanel className="mb-3 p-3">
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={11} /> {t.sectionSeason}
              </span>
            </SectionLabel>
            <StatRow icon={Calendar}  label={seasonLabel}              value={gaia.season.season} accent={seasonColor} />
            <StatRow icon={Calendar}  label={t.reportSeasonProgress}   value={`${(gaia.season.seasonProgress * 100).toFixed(1)}%`} />
            <StatRow icon={Sun}       label={t.reportSolarDeclination} value={`${(gaia.season.solarDeclination * 180 / Math.PI).toFixed(2)}°`} />
            <StatRow icon={Sunrise}   label={t.reportDayPhase}         value={gaia.season.dayPhase} accent={gaia.season.dayPhase === 'day' ? 'text-success' : gaia.season.dayPhase === 'night' ? 'text-info' : 'text-warning'} />
            <StatRow icon={Sunrise}   label={t.reportDayBlend}         value={gaia.season.dayBlend.toFixed(3)} />
            <StatRow icon={Sun}       label={t.reportGoldenHour}       value={gaia.season.goldenHour.toFixed(3)} accent={gaia.season.goldenHour > 0.3 ? 'text-warning' : 'text-gaia-50/90'} />
          </GlassPanel>

          {/* Climate — solar + temperature */}
          <GlassPanel className="mb-3 p-3">
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <Sun size={11} /> {t.reportSolarConst.split(' ')[0]}
              </span>
            </SectionLabel>
            <StatRow icon={Sun}        label={t.reportSolarConst}  value={`${gaia.climate.effectiveSolarConstant.toFixed(0)} W/m²`} />
            <StatRow icon={Zap}        label={t.reportAbsorbed}    value={`${gaia.climate.absorbedEnergy.toFixed(1)} W/m²`} />
            <StatRow icon={Thermometer} label={t.reportEquilTemp}  value={`${gaia.climate.equilibriumTemp.toFixed(1)} K`} />
            <StatRow icon={Thermometer} label={t.reportSurfaceTemp} value={`${gaia.climate.globalMeanTemp.toFixed(1)} K`} accent="text-warning" />
            <StatRow icon={Snowflake}  label={t.reportIceMelt}     value={`${gaia.climate.iceMeltTendency.toFixed(2)} K/yr`} accent={gaia.climate.iceMeltTendency > 0 ? 'text-error' : 'text-info'} />
            <StatRow icon={Wind}       label={t.reportHadley}      value={`${gaia.climate.hadleyCells} cells`} />
          </GlassPanel>

          {/* Ocean — new in Sprint 5 */}
          <GlassPanel className="mb-3 p-3">
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <Waves size={11} /> {t.sectionOcean}
              </span>
            </SectionLabel>
            <StatRow icon={Thermometer} label={t.reportOceanTemp}     value={`${gaia.ocean.meanTemperature.toFixed(1)} K`} />
            <StatRow icon={Waves}       label={t.reportOceanDepth}    value={`${(gaia.ocean.meanDepth / 1000).toFixed(1)} km`} />
            <StatRow icon={Droplets}    label={t.reportOceanSalinity} value={`${gaia.ocean.salinity.toFixed(1)} PSU`} />
            <StatRow icon={Waves}       label={t.reportOceanCoverage} value={`${(gaia.ocean.coverage * 100).toFixed(1)}%`} />
          </GlassPanel>

          {/* Hydrology — water cycle */}
          <GlassPanel className="mb-3 p-3">
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <Droplets size={11} /> {t.sectionHydrology}
              </span>
            </SectionLabel>
            <StatRow icon={Snowflake}   label={t.reportIceFraction}    value={`${(gaia.hydrology.iceFraction * 100).toFixed(2)}%`} accent={gaia.hydrology.iceFraction > 0.1 ? 'text-info' : 'text-warning'} />
            <StatRow icon={Cloud}       label={t.reportCloudCover}     value={`${(gaia.hydrology.cloudCover * 100).toFixed(1)}%`} />
            <StatRow icon={Cloud}       label={t.reportCloudDensity}   value={gaia.hydrology.cloudDensity.toFixed(3)} />
            <StatRow icon={Cloud}       label={t.reportCloudHeight}    value={gaia.hydrology.cloudHeight.toFixed(3)} />
            <StatRow icon={Wind}        label={t.reportWindSpeed}      value={`${gaia.hydrology.windSpeed.toFixed(1)} m/s`} accent="text-accent-300" />
            <StatRow icon={Navigation}  label={t.reportWindDirection}  value={`${(gaia.hydrology.windDirection * 180 / Math.PI).toFixed(0)}°`} />
            <StatRow icon={Droplets}    label={t.reportPrecipitableWater} value={`${gaia.hydrology.precipitableWater.toFixed(1)} mm`} />
          </GlassPanel>

          {/* Ocean Dynamics — Sprint 6 */}
          <GlassPanel className="mb-3 p-3">
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <Waves size={11} /> {t.sectionOceanDynamics}
              </span>
            </SectionLabel>
            <StatRow icon={Waves}      label={t.reportOceanCurrentSpeed} value={`${gaia.ocean.oceanCurrentSpeed.toFixed(3)} m/s`} accent="text-accent-300" />
            <StatRow icon={Navigation} label={t.reportOceanCurrentDir}   value={`${(gaia.ocean.oceanCurrentDirection * 180 / Math.PI).toFixed(0)}°`} />
            <StatRow icon={Waves}      label={t.reportEquatorialCurrent} value={`${gaia.ocean.equatorialCurrent.toFixed(3)} m/s`} />
            <StatRow icon={Waves}      label={t.reportPolarCurrent}      value={`${gaia.ocean.polarCurrent.toFixed(3)} m/s`} />
            <StatRow icon={Zap}        label={t.reportHeatTransport}     value={`${gaia.ocean.heatTransport.toFixed(2)} PW`} accent="text-warning" />
            <StatRow icon={Thermometer} label={t.reportSST}              value={`${gaia.ocean.seaSurfaceTemperature.toFixed(2)} K`} accent={gaia.ocean.seaSurfaceTemperature > 0 ? 'text-error' : 'text-info'} />
          </GlassPanel>

          {/* Wind Field — Sprint 6 */}
          <GlassPanel className="mb-3 p-3">
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <Wind size={11} /> {t.sectionWind}
              </span>
            </SectionLabel>
            <StatRow icon={Wind}   label={t.reportTradeWind}       value={`${gaia.wind.tradeWind.toFixed(1)} m/s`} />
            <StatRow icon={Wind}   label={t.reportWesterlies}      value={`${gaia.wind.westerlies.toFixed(1)} m/s`} />
            <StatRow icon={Wind}   label={t.reportPolarWind}       value={`${gaia.wind.polarWind.toFixed(1)} m/s`} />
            <StatRow icon={Wind}   label={t.reportJetStream}       value={`${gaia.wind.jetStream.toFixed(1)} m/s`} accent="text-accent-300" />
            <StatRow icon={Wind}   label={t.reportMonsoon}         value={`${(gaia.wind.monsoonStrength * 100).toFixed(0)}%`} accent={gaia.wind.monsoonStrength > 0.5 ? 'text-warning' : 'text-gaia-50/90'} />
            <StatRow icon={Wind}   label={t.reportGlobalWindSpeed} value={`${gaia.wind.globalWindSpeed.toFixed(1)} m/s`} accent="text-accent-200" />
          </GlassPanel>

          {/* Weather — Sprint 6 */}
          <GlassPanel className="mb-3 p-3">
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <CloudRain size={11} /> {t.sectionWeather}
              </span>
            </SectionLabel>
            <StatRow icon={Droplets}  label={t.reportHumidity}       value={`${gaia.hydrology.humidity.toFixed(0)}%`} accent="text-info" />
            <StatRow icon={Tornado}   label={t.reportStormIntensity} value={`${(gaia.hydrology.stormIntensity * 100).toFixed(0)}%`} accent={gaia.hydrology.stormIntensity > 0.5 ? 'text-error' : 'text-warning'} />
            <StatRow icon={Hourglass} label={t.reportCloudLifetime}  value={`${gaia.hydrology.cloudLifetime.toFixed(1)} h`} />
            <StatRow icon={CloudRain} label={t.reportPrecipType}     value={precipTypeLabel} accent="text-accent-300" />
            <StatRow icon={Droplets}  label={t.reportEvaporation}    value={`${gaia.hydrology.evaporationRate.toFixed(1)} mm/d`} />
            <StatRow icon={CloudRain} label={t.reportPrecipitation}  value={`${gaia.hydrology.precipitationRate.toFixed(1)} mm/d`} />
            <StatRow icon={Waves}     label={t.reportRiverDischarge} value={`${(gaia.hydrology.riverDischarge / 1e3).toFixed(0)}k m³/s`} />
          </GlassPanel>

          {/* Cloud — Sprint 6 */}
          <GlassPanel className="mb-3 p-3">
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <Cloud size={11} /> {t.sectionCloud}
              </span>
            </SectionLabel>
            <StatRow icon={Cloud}      label={t.reportCloudCover}   value={`${(gaia.hydrology.cloudCover * 100).toFixed(1)}%`} accent="text-gaia-50/90" />
            <StatRow icon={Cloud}      label={t.reportCloudDensity} value={gaia.hydrology.cloudDensity.toFixed(3)} />
            <StatRow icon={Cloud}      label={t.reportCloudHeight}  value={gaia.hydrology.cloudHeight.toFixed(3)} />
            <StatRow icon={Wind}       label={t.reportWindSpeed}    value={`${gaia.hydrology.windSpeed.toFixed(1)} m/s`} accent="text-accent-300" />
            <StatRow icon={Hourglass}  label={t.reportCloudLifetime} value={`${gaia.hydrology.cloudLifetime.toFixed(1)} h`} />
          </GlassPanel>

          {/* Performance */}
          <GlassPanel className="p-3">
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <Cpu size={11} /> {t.sectionPerformance}
              </span>
            </SectionLabel>
            <StatRow
              icon={Activity}
              label={t.statFrameRate}
              value={`${fps} fps`}
              accent={fps >= 50 ? 'text-success' : fps >= 30 ? 'text-warning' : 'text-error'}
            />
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
              <motion.div
                className={`h-full rounded-full ${fps >= 50 ? 'bg-success' : fps >= 30 ? 'bg-warning' : 'bg-error'}`}
                animate={{ width: `${Math.min((fps / 60) * 100, 100)}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </GlassPanel>

          {/* Developer Tools — Sprint 6.5.1 */}
          {devMode && (
            <>
              <div className="mb-1 mt-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-accent-300/60">
                {t.devTools}
              </div>
              <DeveloperMonitor />
              <Timeline />
              <Charts />
            </>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
