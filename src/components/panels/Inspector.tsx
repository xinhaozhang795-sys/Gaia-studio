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
} from 'lucide-react';
import { GlassPanel, SectionLabel } from '@/components/ui/Glass';
import { useStudio } from '@/store/useStudio';
import { useT } from '@/i18n';

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

  const activeLayers = Object.entries(layers).filter(([, v]) => v).length;
  const viewLabel    = t.viewModeLabel[viewMode] ?? viewMode;
  const timeLabel    = (() => {
    const h = Math.floor(timeOfDay) % 24;
    const m = Math.round((timeOfDay - Math.floor(timeOfDay)) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  })();

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
            <button
              onClick={toggleInspector}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-gaia-50/70 transition-colors hover:bg-white/10"
              aria-label={t.closeInspector}
            >
              <PanelRightClose size={14} />
            </button>
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

          {/* Simulation Report */}
          <GlassPanel className="mb-3 p-3">
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <FlaskConical size={11} /> {t.sectionSimReport}
              </span>
            </SectionLabel>

            {/* Rotation consequences */}
            <div className="mb-2 mt-1 text-[9px] font-semibold uppercase tracking-wider text-accent-300/70">
              <span className="inline-flex items-center gap-1"><RotateCw size={9} /> {t.reportRotation}</span>
            </div>
            <StatRow icon={Clock}     label={t.reportDayLength}   value={`${gaia.planet.dayLengthHours.toFixed(1)} h`} />
            <StatRow icon={RotateCw}   label={t.reportAngularVel}  value={`${(gaia.planet.angularVelocity * 1e5).toExponential(2)} ×10⁻⁵ rad/s`} />
            <StatRow icon={Wind}       label={t.reportCoriolis}    value={`${(gaia.planet.coriolis45 * 1e5).toExponential(2)} ×10⁻⁵ s⁻¹`} />
            <StatRow icon={Gauge}      label={t.reportGravityEq}   value={`${gaia.planet.gravityEquator.toFixed(3)} m/s²`} />
            <StatRow icon={Gauge}      label={t.reportGravityPole} value={`${gaia.planet.gravityPole.toFixed(3)} m/s²`} />
            <StatRow icon={Globe2}     label={t.reportFlattening}  value={`${(gaia.planet.flattening * 1000).toFixed(2)} ‰`} accent="text-accent-200" />

            {/* Sun intensity consequences */}
            <div className="mb-2 mt-3 text-[9px] font-semibold uppercase tracking-wider text-accent-300/70">
              <span className="inline-flex items-center gap-1"><Sun size={9} /> {t.reportSolarConst.split(' ')[0]}</span>
            </div>
            <StatRow icon={Sun}        label={t.reportSolarConst}  value={`${gaia.climate.effectiveSolarConstant.toFixed(0)} W/m²`} />
            <StatRow icon={Zap}        label={t.reportAbsorbed}    value={`${gaia.climate.absorbedEnergy.toFixed(1)} W/m²`} />
            <StatRow icon={Thermometer} label={t.reportEquilTemp}  value={`${gaia.climate.equilibriumTemp.toFixed(1)} K`} />
            <StatRow icon={Thermometer} label={t.reportSurfaceTemp} value={`${gaia.climate.globalMeanTemp.toFixed(1)} K`} accent="text-warning" />
            <StatRow icon={Snowflake}  label={t.reportIceMelt}     value={`${gaia.climate.iceMeltTendency.toFixed(2)} K/yr`} accent={gaia.climate.iceMeltTendency > 0 ? 'text-error' : 'text-info'} />
            <StatRow icon={Waves}      label={t.reportOceanTend}   value={`${gaia.climate.oceanTempTendency.toFixed(3)} K/yr`} accent={gaia.climate.oceanTempTendency > 0 ? 'text-warning' : 'text-info'} />
            <StatRow icon={Wind}       label={t.reportHadley}      value={`${gaia.climate.hadleyCells} cells`} />
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
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
