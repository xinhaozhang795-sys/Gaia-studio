import { motion, AnimatePresence } from 'framer-motion';
import {
  Orbit,
  Move,
  Ruler,
  RotateCw,
  Home,
  Eye,
  EyeOff,
  PanelLeft,
} from 'lucide-react';
import { GlassButton } from '@/components/ui/Glass';
import { useStudio, type ToolMode } from '@/store/useStudio';
import { useT } from '@/i18n';

export function Toolbar() {
  const t               = useT();
  const tool            = useStudio((s) => s.tool);
  const setTool         = useStudio((s) => s.setTool);
  const autoRotate      = useStudio((s) => s.autoRotate);
  const setAutoRotate   = useStudio((s) => s.setAutoRotate);
  const resetView       = useStudio((s) => s.resetView);
  const toolbarOpen     = useStudio((s) => s.toolbarOpen);
  const toggleToolbar   = useStudio((s) => s.toggleToolbar);
  const inspectorOpen   = useStudio((s) => s.inspectorOpen);
  const toggleInspector = useStudio((s) => s.toggleInspector);

  const TOOLS: { id: ToolMode; icon: typeof Orbit; label: string }[] = [
    { id: 'orbit',   icon: Orbit, label: t.toolOrbit },
    { id: 'pan',     icon: Move,  label: t.toolPan },
    { id: 'measure', icon: Ruler, label: t.toolMeasure },
  ];

  return (
    <>
      {/* collapse toggle */}
      <motion.button
        onClick={toggleToolbar}
        whileTap={{ scale: 0.9 }}
        className="glass fixed left-3 top-1/2 z-30 flex h-8 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-gaia-100/70 hover:text-white"
        aria-label={toolbarOpen ? t.collapseToolbar : t.expandToolbar}
      >
        <PanelLeft size={14} className={toolbarOpen ? '' : 'rotate-180'} />
      </motion.button>

      <AnimatePresence>
        {toolbarOpen && (
          <motion.div
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="glass-strong fixed left-4 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-1.5 rounded-2xl p-2"
          >
            {/* brand mark */}
            <div className="mb-1 flex flex-col items-center gap-1 pb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400/30 to-ocean/30 text-accent-300">
                <span className="text-[15px] font-bold">G</span>
              </div>
            </div>

            <div className="mb-1 h-px w-full bg-white/8" />

            {TOOLS.map(({ id, icon: Icon, label }) => (
              <GlassButton
                key={id}
                active={tool === id}
                onClick={() => setTool(id)}
                label={label}
              >
                <Icon size={18} strokeWidth={1.8} />
              </GlassButton>
            ))}

            <div className="my-1 h-px w-full bg-white/8" />

            <GlassButton
              active={autoRotate}
              onClick={() => setAutoRotate(!autoRotate)}
              label={t.autoRotate}
            >
              <RotateCw size={18} strokeWidth={1.8} />
            </GlassButton>

            <GlassButton onClick={resetView} label={t.resetView}>
              <Home size={18} strokeWidth={1.8} />
            </GlassButton>

            <div className="my-1 h-px w-full bg-white/8" />

            <GlassButton
              onClick={toggleInspector}
              active={inspectorOpen}
              label={t.toggleInspector}
            >
              {inspectorOpen
                ? <Eye size={18} strokeWidth={1.8} />
                : <EyeOff size={18} strokeWidth={1.8} />}
            </GlassButton>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
