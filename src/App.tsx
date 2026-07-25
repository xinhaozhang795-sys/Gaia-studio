import { Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe2 } from 'lucide-react';
import { Scene } from '@/three/Scene';
import { Toolbar } from '@/components/panels/Toolbar';
import { ControlCenter, ControlCenterTab } from '@/components/panels/ControlCenter';
import { Inspector } from '@/components/panels/Inspector';
import { StatusBar } from '@/components/panels/StatusBar';
import { useResponsive } from '@/hooks/useResponsive';
import { useT } from '@/i18n';
import { sim } from '@/simulation';

// Start the simulation loop once on module load. It runs on its own RAF,
// decoupled from rendering. React mirrors its state via useStudio.
sim.start();

function BootScreen({ done }: { done: boolean }) {
  const t = useT();
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 animate-ping rounded-full bg-accent-400/20" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400/30 to-ocean/30">
              <Globe2 size={32} className="text-accent-200" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-2xl font-semibold tracking-tight text-white"
          >
            {t.appName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-1.5 text-[12px] text-gaia-100/50"
          >
            {t.bootSubtitle}
          </motion.p>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 120 }}
            transition={{ delay: 0.4, duration: 1.2, ease: 'easeInOut' }}
            className="mt-5 h-0.5 rounded-full bg-gradient-to-r from-transparent via-accent-400 to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  useResponsive();
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Fullscreen WebGL canvas */}
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </div>

      {/* subtle vignette for depth */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* UI overlay */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="pointer-events-auto">
          <StatusBar />
          <Toolbar />
          <Inspector />
          <ControlCenter />
          <ControlCenterTab />
        </div>
      </div>

      <BootScreen done={booted} />
    </div>
  );
}
