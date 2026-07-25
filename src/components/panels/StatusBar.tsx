import { motion } from 'framer-motion';
import { Globe2, Activity, Wifi, Cpu } from 'lucide-react';
import { useStudio } from '@/store/useStudio';
import { useT } from '@/i18n';

export function StatusBar() {
  const t       = useT();
  const fps      = useStudio((s) => s.fps);
  const viewMode = useStudio((s) => s.viewMode);

  const viewLabel = t.viewModeLabel[viewMode] ?? viewMode;

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass-strong pointer-events-auto fixed left-1/2 top-3 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full px-4 py-2"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400/40 to-ocean/40">
          <Globe2 size={14} className="text-accent-200" />
        </div>
        <span className="text-[13px] font-semibold tracking-tight text-white">{t.appName}</span>
        <span className="hidden text-[10px] font-medium text-gaia-100/40 sm:inline">{t.appVersion}</span>
      </div>

      <div className="hidden h-4 w-px bg-white/10 sm:block" />

      <div className="hidden items-center gap-3 text-[11px] text-gaia-100/60 sm:flex">
        <span className="flex items-center gap-1.5">
          <Activity size={11} className={fps >= 50 ? 'text-success' : 'text-warning'} />
          {fps} fps
        </span>
        <span className="flex items-center gap-1.5">
          <Cpu size={11} className="text-accent-300" />
          {viewLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <Wifi size={11} className="text-success" />
          {t.webgl}
        </span>
      </div>
    </motion.div>
  );
}
