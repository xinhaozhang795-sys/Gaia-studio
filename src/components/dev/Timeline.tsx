import { useCallback } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, Clock } from 'lucide-react';
import { GlassPanel, SectionLabel, GlassButton } from '@/components/ui/Glass';
import { useStudio } from '@/store/useStudio';
import { useT } from '@/i18n';
import { sim } from '@/simulation';
import type { ClockPreset } from '@/simulation/types';
import { SECONDS } from '@/simulation/UnitSystem';

const SPEEDS: { preset: ClockPreset; key: string }[] = [
  { preset: '1x', key: 'clock1x' },
  { preset: '10x', key: 'clock10x' },
  { preset: '24x', key: 'clock24x' },
  { preset: '100x', key: 'clock100x' },
  { preset: '365x', key: 'clock365x' },
  { preset: '1000x', key: 'clock1000x' },
];

const DAYS_PER_YEAR = 365.25;
const MAX_YEAR_SLIDER = 50;

export function Timeline() {
  const t = useT();
  const simRunning = useStudio((s) => s.simRunning);
  const setSimRunning = useStudio((s) => s.setSimRunning);
  const clockPreset = useStudio((s) => s.clockPreset);
  const setClockPreset = useStudio((s) => s.setClockPreset);
  const simDayOfYear = useStudio((s) => s.simDayOfYear);
  const simYear = useStudio((s) => s.simYear);

  const handlePlayPause = useCallback(() => {
    setSimRunning(!simRunning);
  }, [simRunning, setSimRunning]);

  const handleReset = useCallback(() => {
    setSimRunning(false);
    sim.reset();
  }, [setSimRunning]);

  const handleStep = useCallback(() => {
    if (simRunning) setSimRunning(false);
    sim.singleStep();
  }, [simRunning, setSimRunning]);

  // ── Seek: convert day-of-year + year into simTime and set the clock ───────
  const seekToDay = useCallback((day: number) => {
    const newSimTime = simYear * SECONDS.perYear + (day - 1) * SECONDS.perDay + 12 * 3600;
    sim.clock.setSimTime(newSimTime);
    sim.state.patch('simulation', {
      simTime: newSimTime,
      dayOfYear: Math.max(1, Math.min(366, Math.floor(day))),
    });
    sim.state.commit();
  }, [simYear]);

  const seekToYear = useCallback((year: number) => {
    const newSimTime = year * SECONDS.perYear + (simDayOfYear - 1) * SECONDS.perDay + 12 * 3600;
    sim.clock.setSimTime(newSimTime);
    sim.state.patch('simulation', { simTime: newSimTime, year });
    sim.state.commit();
  }, [simDayOfYear]);

  const seekToSimTime = useCallback((seconds: number) => {
    sim.clock.setSimTime(seconds);
    sim.state.patch('simulation', { simTime: seconds });
    sim.state.commit();
  }, []);

  const totalSimSeconds = simYear * SECONDS.perYear + simDayOfYear * SECONDS.perDay;
  const maxSimSeconds = 10 * SECONDS.perYear;

  return (
    <GlassPanel className="mb-3 p-3">
      <SectionLabel>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={11} /> {t.timeline}
        </span>
      </SectionLabel>

      {/* Transport controls */}
      <div className="mb-2.5 flex items-center gap-1.5">
        <GlassButton onClick={handlePlayPause} active={simRunning}
          label={simRunning ? t.tlPause : t.tlPlay}>
          {simRunning ? <Pause size={16} /> : <Play size={16} />}
        </GlassButton>
        <GlassButton onClick={handleStep} label={t.tlStep}>
          <ChevronRight size={16} />
        </GlassButton>
        <GlassButton onClick={handleReset} label={t.tlReset}>
          <RotateCcw size={16} />
        </GlassButton>
      </div>

      {/* Speed selector */}
      <div className="mb-2.5">
        <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-gaia-100/50">
          {t.tlSpeed}
        </div>
        <div className="grid grid-cols-6 gap-1">
          {SPEEDS.map(({ preset, key }) => {
            const label = t[key as keyof typeof t] as string;
            const active = clockPreset === preset;
            return (
              <button
                key={preset}
                onClick={() => setClockPreset(preset)}
                className={`rounded-md border px-1 py-1 text-[10px] font-mono transition-colors ${
                  active
                    ? 'border-accent-400/50 bg-accent-400/20 text-accent-300'
                    : 'border-white/8 bg-white/5 text-gaia-50/70 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day slider */}
      <div className="mb-2">
        <div className="mb-0.5 flex items-center justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-gaia-100/50">{t.tlDay}</span>
          <span className="font-mono text-[10px] text-accent-300">{simDayOfYear.toFixed(0)}</span>
        </div>
        <input
          type="range" min={1} max={Math.ceil(DAYS_PER_YEAR)} step={1}
          value={Math.max(1, Math.min(DAYS_PER_YEAR, simDayOfYear))}
          onChange={(e) => seekToDay(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Year slider */}
      <div className="mb-2">
        <div className="mb-0.5 flex items-center justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-gaia-100/50">{t.tlYear}</span>
          <span className="font-mono text-[10px] text-accent-300">{simYear}</span>
        </div>
        <input
          type="range" min={0} max={MAX_YEAR_SLIDER} step={1}
          value={Math.min(MAX_YEAR_SLIDER, simYear)}
          onChange={(e) => seekToYear(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      {/* Sim time slider (fine seek within 10-year window) */}
      <div>
        <div className="mb-0.5 flex items-center justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-gaia-100/50">{t.tlSimTime}</span>
          <span className="font-mono text-[10px] text-accent-300">
            {(totalSimSeconds / SECONDS.perDay).toFixed(1)}d
          </span>
        </div>
        <input
          type="range" min={0} max={maxSimSeconds} step={SECONDS.perHour}
          value={Math.min(maxSimSeconds, totalSimSeconds)}
          onChange={(e) => seekToSimTime(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
    </GlassPanel>
  );
}
