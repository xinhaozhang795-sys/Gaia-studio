import { useEffect, useRef, useState, useCallback } from 'react';
import { Download, LineChart as LineChartIcon } from 'lucide-react';
import { GlassPanel, SectionLabel } from '@/components/ui/Glass';
import { useT } from '@/i18n';
import { sim, SimulationRecorder, type Sample } from '@/simulation';

/**
 * Charts — live line-chart panel for the Inspector.
 *
 * Reads from a SimulationRecorder ring buffer that is fed every tick.
 * Each chart is a lightweight SVG sparkline — no charting library needed.
 */

const recorder = new SimulationRecorder();

// Feed the recorder from the simulation's committed snapshots.
sim.state.subscribe((snap) => recorder.push(snap));

type ChartKey = 'temperature' | 'humidity' | 'wind' | 'ocean' | 'pressure';

interface ChartConfig {
  key: ChartKey;
  labelKey: string;
  color: string;
  min: number;
  max: number;
  unit: string;
  getValue: (s: Sample) => number;
}

const CHARTS: ChartConfig[] = [
  { key: 'temperature', labelKey: 'chartTemperature', color: '#f59e0b', min: 270, max: 310, unit: 'K',     getValue: (s) => s.temperature },
  { key: 'humidity',    labelKey: 'chartHumidity',    color: '#38bdf8', min: 0,   max: 100, unit: '%',     getValue: (s) => s.humidity },
  { key: 'wind',        labelKey: 'chartWind',        color: '#a78bfa', min: 0,   max: 15,  unit: 'm/s',   getValue: (s) => s.windSpeed },
  { key: 'ocean',       labelKey: 'chartOcean',       color: '#22d3ee', min: -10, max: 10,  unit: 'K',     getValue: (s) => s.oceanSST },
  { key: 'pressure',    labelKey: 'chartPressure',    color: '#4ade80', min: 95000, max: 105000, unit: 'Pa', getValue: (s) => s.pressure },
];

const VIEW_SAMPLES = 300;
const W = 240;
const H = 48;

function Sparkline({ samples, config }: { samples: Sample[]; config: ChartConfig }) {
  const t = useT();
  if (samples.length < 2) {
    return (
      <div className="flex h-12 items-center justify-center text-[10px] text-gaia-100/40">
        {t.chartNoData}
      </div>
    );
  }

  // Take the last N samples for the visible window
  const view = samples.slice(-VIEW_SAMPLES);
  const n = view.length;
  const range = config.max - config.min;

  // Build SVG path
  const points = view.map((s, i) => {
    const x = (i / (n - 1)) * W;
    const v = config.getValue(s);
    const clamped = Math.max(config.min, Math.min(config.max, v));
    const y = H - ((clamped - config.min) / range) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const fillPath = `${linePath} L ${W},${H} L 0,${H} Z`;
  const lastValue = config.getValue(view[n - 1]);
  const label = t[config.labelKey as keyof typeof t] as string;

  return (
    <div className="rounded-lg bg-white/5 px-2 py-1.5">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] text-gaia-50/70">{label}</span>
        <span className="font-mono text-[10px]" style={{ color: config.color }}>
          {lastValue.toFixed(1)} {config.unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 48 }}>
        <defs>
          <linearGradient id={`grad-${config.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={config.color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={config.color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill={`url(#grad-${config.key})`} />
        <path d={linePath} fill="none" stroke={config.color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function Charts() {
  const t = useT();
  const [samples, setSamples] = useState<Sample[]>([]);
  const tickRef = useRef(0);

  // Refresh every ~10 ticks to limit re-renders while keeping charts live
  useEffect(() => {
    const unsub = sim.state.subscribe(() => {
      tickRef.current++;
      if (tickRef.current % 10 === 0) {
        setSamples(recorder.samples());
      }
    });
    return unsub;
  }, []);

  const handleExport = useCallback(() => {
    const csv = recorder.toCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gaia-simulation-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const recorderSize = recorder.size;

  return (
    <GlassPanel className="mb-3 p-3">
      <SectionLabel>
        <span className="inline-flex items-center gap-1.5">
          <LineChartIcon size={11} /> {t.charts}
        </span>
      </SectionLabel>

      <div className="space-y-1.5">
        {CHARTS.map((config) => (
          <Sparkline key={config.key} samples={samples} config={config} />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-white/8 pt-2">
        <span className="text-[9px] text-gaia-100/40">
          {recorderSize} / {recorder.capacity} samples
        </span>
        <button
          onClick={handleExport}
          disabled={recorderSize === 0}
          className="flex items-center gap-1 rounded-md border border-white/8 bg-white/5 px-2 py-1 text-[10px] text-gaia-50/70 transition-colors hover:bg-white/10 disabled:opacity-40"
        >
          <Download size={10} /> {t.chartExport}
        </button>
      </div>
    </GlassPanel>
  );
}
