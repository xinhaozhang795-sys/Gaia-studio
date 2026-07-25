import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Globe2,
  Cloud,
  Sparkles,
  Grid3x3,
  Lightbulb,
  Sun,
  Layers,
  Pause,
  Play,
  Clock,
  Gauge,
} from 'lucide-react';
import { useState } from 'react';
import { GlassPanel, SectionLabel, Slider, ToggleRow } from '@/components/ui/Glass';
import { useStudio, type ViewMode, type LayerKey, type ClockPreset } from '@/store/useStudio';
import { useT } from '@/i18n';

export function ControlCenter() {
  const t = useT();
  const [expanded, setExpanded] = useState(true);

  const controlCenterOpen  = useStudio((s) => s.controlCenterOpen);
  const toggleControlCenter = useStudio((s) => s.toggleControlCenter);
  const viewMode           = useStudio((s) => s.viewMode);
  const setViewMode        = useStudio((s) => s.setViewMode);
  const autoRotate         = useStudio((s) => s.autoRotate);
  const setAutoRotate      = useStudio((s) => s.setAutoRotate);
  const simRunning         = useStudio((s) => s.simRunning);
  const setSimRunning      = useStudio((s) => s.setSimRunning);
  const clockPreset        = useStudio((s) => s.clockPreset);
  const setClockPreset     = useStudio((s) => s.setClockPreset);
  const rotationSpeed      = useStudio((s) => s.rotationSpeed);
  const setRotationSpeed   = useStudio((s) => s.setRotationSpeed);
  const layers             = useStudio((s) => s.layers);
  const toggleLayer        = useStudio((s) => s.toggleLayer);
  const sunIntensity       = useStudio((s) => s.sunIntensity);
  const setSunIntensity    = useStudio((s) => s.setSunIntensity);
  const cloudOpacity       = useStudio((s) => s.cloudOpacity);
  const setCloudOpacity    = useStudio((s) => s.setCloudOpacity);
  const atmosphereGlow     = useStudio((s) => s.atmosphereGlow);
  const setAtmosphereGlow  = useStudio((s) => s.setAtmosphereGlow);
  const starDensity        = useStudio((s) => s.starDensity);
  const setStarDensity     = useStudio((s) => s.setStarDensity);
  const timeOfDay          = useStudio((s) => s.timeOfDay);
  const setTimeOfDay       = useStudio((s) => s.setTimeOfDay);

  const VIEW_MODES: { id: ViewMode; label: string }[] = [
    { id: 'realistic',   label: t.viewRealistic },
    { id: 'topographic', label: t.viewTopographic },
    { id: 'night',       label: t.viewNight },
    { id: 'wireframe',   label: t.viewWireframe },
  ];

  const LAYER_META: { key: LayerKey; label: string; icon: typeof Globe2 }[] = [
    { key: 'atmosphere',  label: t.layerAtmosphere,  icon: Sparkles },
    { key: 'clouds',      label: t.layerClouds,      icon: Cloud },
    { key: 'stars',       label: t.layerStars,       icon: Globe2 },
    { key: 'grid',        label: t.layerGrid,        icon: Grid3x3 },
    { key: 'nightLights', label: t.layerNightLights, icon: Lightbulb },
  ];

  const CLOCK_PRESETS: { id: ClockPreset; label: string }[] = [
    { id: '1x',    label: t.clock1x },
    { id: '24x',   label: t.clock24x },
    { id: '365x',  label: t.clock365x },
    { id: '1000x', label: t.clock1000x },
  ];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-3 sm:px-4 sm:pb-4">
      <motion.div
        layout
        className="glass-strong pointer-events-auto w-full max-w-3xl overflow-hidden rounded-2xl"
        style={{ maxWidth: expanded ? 760 : 220 }}
      >
        {/* header row */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <Layers size={15} className="text-accent-300" />
            <span className="text-[13px] font-semibold tracking-tight text-white">{t.controlCenter}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSimRunning(!simRunning)}
              className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5 text-[11px] text-gaia-50/80 transition-colors hover:bg-white/10"
            >
              {simRunning ? <Pause size={12} /> : <Play size={12} />}
              {simRunning ? t.pause : t.play}
            </button>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-gaia-50/80 transition-colors hover:bg-white/10"
              aria-label={expanded ? t.collapse : t.expand}
            >
              <ChevronDown size={14} className={`transition-transform ${expanded ? '' : 'rotate-180'}`} />
            </button>
            <button
              onClick={toggleControlCenter}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-gaia-50/80 transition-colors hover:bg-white/10"
              aria-label={t.hide}
            >
              <ChevronDown size={14} className="-rotate-90" />
            </button>
          </div>
        </div>

        <AnimatePresence ial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-4 px-4 pb-4 sm:grid-cols-2">
                {/* View modes */}
                <GlassPanel className="p-3">
                  <SectionLabel>{t.renderMode}</SectionLabel>
                  <div className="grid grid-cols-2 gap-1.5">
                    {VIEW_MODES.map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => setViewMode(id)}
                        className={`rounded-lg px-2.5 py-2 text-[12px] font-medium transition-all ${
                          viewMode === id
                            ? 'bg-accent-400/25 text-accent-200 ring-1 ring-accent-400/40'
                            : 'bg-white/5 text-gaia-50/70 hover:bg-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <SectionLabel>{t.rotationSpeed}</SectionLabel>
                    <Slider
                      value={rotationSpeed}
                      min={0}
                      max={5}
                      step={0.1}
                      onChange={setRotationSpeed}
                      format={(v) => `${v.toFixed(1)}x`}
                    />
                  </div>
                </GlassPanel>

                {/* Layers */}
                <GlassPanel className="p-3">
                  <SectionLabel>{t.layers}</SectionLabel>
                  <div className="space-y-0.5">
                    {LAYER_META.map(({ key, label, icon: Icon }) => (
                      <ToggleRow
                        key={key}
                        label={label}
                        on={layers[key]}
                        onChange={() => toggleLayer(key)}
                        icon={<Icon size={14} strokeWidth={1.8} />}
                      />
                    ))}
                  </div>
                </GlassPanel>

                {/* Environment */}
                <GlassPanel className="p-3 sm:col-span-2">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <SectionLabel>
                        <span className="inline-flex items-center gap-1.5">
                          <Sun size={11} /> {t.sunIntensity}
                        </span>
                      </SectionLabel>
                      <Slider value={sunIntensity} min={0} max={3} step={0.05} onChange={setSunIntensity} />
                    </div>
                    <div>
                      <SectionLabel>
                        <span className="inline-flex items-center gap-1.5">
                          <Cloud size={11} /> {t.cloudOpacity}
                        </span>
                      </SectionLabel>
                      <Slider value={cloudOpacity} min={0} max={1} step={0.02} onChange={setCloudOpacity} />
                    </div>
                    <div>
                      <SectionLabel>
                        <span className="inline-flex items-center gap-1.5">
                          <Sparkles size={11} /> {t.atmosphereGlow}
                        </span>
                      </SectionLabel>
                      <Slider value={atmosphereGlow} min={0} max={2.5} step={0.05} onChange={setAtmosphereGlow} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <SectionLabel>{t.starDensity}</SectionLabel>
                    <Slider value={starDensity} min={0.1} max={1.5} step={0.05} onChange={setStarDensity} format={(v) => `${Math.round(v * 6000)}`} />
                  </div>
                  <div className="mt-3">
                    <SectionLabel>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={11} /> {t.timeOfDay}
                      </span>
                    </SectionLabel>
                    <Slider
                      value={timeOfDay}
                      min={0}
                      max={24}
                      step={0.25}
                      onChange={setTimeOfDay}
                      format={(v) => {
                        const h = Math.floor(v) % 24;
                        const m = Math.round((v - Math.floor(v)) * 60);
                        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                      }}
                    />
                  </div>
                  <div className="mt-3">
                    <SectionLabel>
                      <span e="inline-flex items-center gap-1.5">
                        <Gauge size={11} /> {t.simClock}
                      </span>
                    </SectionLabel>
                    <div className="grid grid-cols-4 gap-1.5">
                      {CLOCK_PRESETS.map(({ id, label }) => (
                        <button
                          key={id}
                          onClick={() => setClockPreset(id)}
                          className={`rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-colors ${
                            clockPreset === id
                              ? 'border-accent-400/40 bg-accent-400/15 text-accent-200'
                              : 'border-white/8 bg-white/5 text-gaia-50/60 hover:bg-white/10'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </GlassPanel>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/** Floating tab to re-open the control center when hidden. */
export function ControlCenterTab() {
  const t = useT();
  const controlCenterOpen   = useStudio((s) => s.controlCenterOpen);
  const toggleControlCenter = useStudio((s) => s.toggleControlCenter);
  if (controlCenterOpen) return null;
  return (
    <motion.button
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onClick={toggleControlCenter}
      className="glass pointer-events-auto fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-[12px] text-gaia-50/80"
    >
      <Layers size={14} className="text-accent-300" />
      {t.showControls}
    </motion.button>
      );
}
