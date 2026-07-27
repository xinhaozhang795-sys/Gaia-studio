import { useEffect, useState, useRef } from 'react';
import { Activity, Cpu, MemoryStick, Clock, GitBranch, Boxes, Timer, Gauge } from 'lucide-react';
import { GlassPanel, SectionLabel } from '@/components/ui/Glass';
import { useStudio } from '@/store/useStudio';
import { useT } from '@/i18n';
import { sim } from '@/simulation';
import { BUILD_VERSION, BUILD_DATE } from '@/utils/buildVersion';

interface MemInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

function useMemory(): MemInfo | null {
  const [mem, setMem] = useState<MemInfo | null>(null);
  useEffect(() => {
    const check = () => {
      const p = performance as unknown as { memory?: MemInfo };
      if (p.memory) setMem(p.memory);
    };
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, []);
  return mem;
}

function fmtBytes(b: number): string {
  if (b > 1e9) return `${(b / 1e9).toFixed(2)} GB`;
  if (b > 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  return `${(b / 1e3).toFixed(0)} KB`;
}

function fmtSimTime(s: number): string {
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  if (days > 365) {
    const y = Math.floor(days / 365);
    const d = days % 365;
    return `${y}y ${d}d`;
  }
  return `${days}d ${hours}h`;
}

export function DeveloperMonitor() {
  const t = useT();
  const fps = useStudio((s) => s.fps);
  const gaia = useStudio((s) => s.gaia);
  const mem = useMemory();
  const [frameTime, setFrameTime] = useState(0);
  const [profile, setProfile] = useState(sim.lastProfile);
  const rafRef = useRef(0);

  // Track frame time from RAF
  useEffect(() => {
    let last = performance.now();
    const loop = () => {
      const now = performance.now();
      setFrameTime(now - last);
      last = now;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Poll engine profile every 500ms
  useEffect(() => {
    const id = setInterval(() => setProfile(sim.lastProfile), 500);
    return () => clearInterval(id);
  }, []);

  const engineCount = sim.enginesList.length;
  const tickCount = gaia.simulation.tickCount;
  const simTime = gaia.simulation.simTime;

  return (
    <GlassPanel className="mb-3 p-3">
      <SectionLabel>
        <span className="inline-flex items-center gap-1.5">
          <Cpu size={11} /> {t.devMonitor}
        </span>
      </SectionLabel>

      {/* Core metrics */}
      <div className="mb-2 grid grid-cols-2 gap-1.5">
        <Metric icon={Activity} label={t.statFrameRate} value={`${fps}`} unit="fps"
          accent={fps >= 50 ? 'text-success' : fps >= 30 ? 'text-warning' : 'text-error'} />
        <Metric icon={Timer} label={t.devFrameTime} value={frameTime.toFixed(1)} unit="ms"
          accent={frameTime < 20 ? 'text-success' : frameTime < 33 ? 'text-warning' : 'text-error'} />
      </div>

      <div className="mb-2 grid grid-cols-2 gap-1.5">
        <Metric icon={Clock} label={t.devSimTick} value={tickCount.toLocaleString()} unit="" />
        <Metric icon={Gauge} label={t.devSimTime} value={fmtSimTime(simTime)} unit="" accent="text-accent-300" />
      </div>

      <div className="mb-2 grid grid-cols-2 gap-1.5">
        <Metric icon={GitBranch} label={t.devBuildVersion} value={BUILD_VERSION} unit={BUILD_DATE ? `(${BUILD_DATE})` : ''} />
        <Metric icon={Boxes} label={t.devEngineCount} value={`${engineCount}`} unit="" />
      </div>

      {/* Memory (if available) */}
      {mem && (
        <div className="mb-2 grid grid-cols-2 gap-1.5">
          <Metric icon={MemoryStick} label={t.devMemory} value={fmtBytes(mem.usedJSHeapSize)} unit={`/ ${fmtBytes(mem.jsHeapSizeLimit)}`} />
        </div>
      )}

      {/* Engine timings */}
      <div className="mt-3 mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-accent-300/70">
        <span className="inline-flex items-center gap-1"><Timer size={9} /> {t.devEngineTimings}</span>
      </div>
      <div className="space-y-0.5">
        {profile.engines.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded px-1.5 py-1 hover:bg-white/5">
            <span className="text-[11px] capitalize text-gaia-50/70">{e.id}</span>
            <div className="flex items-center gap-2">
              <div className="h-1 w-16 overflow-hidden rounded-full bg-white/8">
                <div
                  className={`h-full rounded-full ${e.ms < 0.5 ? 'bg-success' : e.ms < 2 ? 'bg-warning' : 'bg-error'}`}
                  style={{ width: `${Math.min((e.ms / 5) * 100, 100)}%` }}
                />
              </div>
              <span className="w-14 text-right font-mono text-[10px] text-gaia-50/80">{e.ms.toFixed(2)} ms</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-white/8 pt-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gaia-100/60">{t.devTotalTime}</span>
        <span className="font-mono text-[11px] text-accent-300">{profile.totalMs.toFixed(2)} ms</span>
      </div>
    </GlassPanel>
  );
}

function Metric({ icon: Icon, label, value, unit, accent }: {
  icon: typeof Activity;
  label: string;
  value: string;
  unit: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg bg-white/5 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[9px] text-gaia-100/50">
        <Icon size={9} />
        {label}
      </div>
      <div className={`font-mono text-[12px] ${accent ?? 'text-gaia-50/90'}`}>
        {value}
        {unit && <span className="ml-1 text-[9px] text-gaia-100/40">{unit}</span>}
      </div>
    </div>
  );
}
