import { useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Earth } from '@/three/Earth';
import { Stars } from '@/three/Stars';
import { CoordinateGrid, AxisMarkers } from '@/three/Grid';
import { Sun } from '@/three/Sun';
import { useStudio } from '@/store/useStudio';

// ── Camera bridge: pushes zoom + FPS into the store ─────────────────────────
function CameraBridge({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const setZoom    = useStudio((s) => s.setZoom);
  const setFps     = useStudio((s) => s.setFps);
  const { camera } = useThree();

  const lastZoom    = useRef(-1);
  const frames      = useRef(0);
  const lastFpsTime = useRef(performance.now());
  const lastFpsUpd  = useRef(0);

  useFrame(() => {
    if (controls.current) {
      const d = camera.position.distanceTo(controls.current.target);
      if (Math.abs(d - lastZoom.current) > 0.01) {
        lastZoom.current = d;
        setZoom(d);
      }
    }
    frames.current++;
    const now = performance.now();
    if (now - lastFpsUpd.current > 600) {
      const dt = (now - lastFpsTime.current) / 1000;
      setFps(Math.round(frames.current / dt));
      frames.current    = 0;
      lastFpsTime.current = now;
      lastFpsUpd.current  = now;
    }
  });

  return null;
}

// ── Reset handler ────────────────────────────────────────────────────────────
function ResetHandler({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const resetSignal = useStudio((s) => s.resetViewSignal);
  useEffect(() => {
    if (controls.current && resetSignal > 0) {
      controls.current.reset();
    }
  }, [resetSignal, controls]);
  return null;
}

// ── Double-tap to reset camera (touch devices) ───────────────────────────────
function useDoubleTap(onDoubleTap: () => void, element: React.RefObject<HTMLDivElement | null>) {
  const lastTap = useRef(0);
  useEffect(() => {
    const el = element.current;
    if (!el) return;
    const handler = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const now = Date.now();
      if (now - lastTap.current < 320) {
        e.preventDefault();
        onDoubleTap();
      }
      lastTap.current = now;
    };
    el.addEventListener('touchstart', handler, { passive: false });
    return () => el.removeEventListener('touchstart', handler);
  }, [onDoubleTap, element]);
}

// ── Root scene ───────────────────────────────────────────────────────────────
export function Scene() {
  const controls    = useRef<OrbitControlsImpl | null>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const layers      = useStudio((s) => s.layers);
  const tool        = useStudio((s) => s.tool);
  const isMobile    = useStudio((s) => s.isMobile);
  const resetView   = useStudio((s) => s.resetView);

  // Double-tap to re-center on mobile
  useDoubleTap(useCallback(() => {
    resetView();
  }, [resetView]), wrapperRef);

  // Adaptive device pixel ratio:
  // Desktop  → up to 2× for crisp screens
  // Mobile   → cap at 1.5× to maintain 60 fps on iPhone 14 (2.0 native DPR)
  const dpr = isMobile ? [1, 1.5] : [1, 2];

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%', touchAction: 'none' }}>
      <Canvas
        camera={{ position: [2.2, 1.4, 2.6], fov: 45, near: 0.1, far: 1000 }}
        gl={{
          antialias:         !isMobile,   // MSAA off on mobile (huge perf win)
          alpha:             false,
          powerPreference:   'high-performance',
          logarithmicDepthBuffer: false,
        }}
        dpr={dpr as [number, number]}
        frameloop="always"
        style={{ touchAction: 'none' }}
      >
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.06} />

        {layers.stars && <Stars />}
        {layers.grid  && <CoordinateGrid />}
        {layers.grid  && <AxisMarkers />}

        <Earth />
        <Sun />

        <CameraBridge controls={controls} />
        <ResetHandler controls={controls} />

        <OrbitControls
          ref={controls}
          enableDamping
          dampingFactor={0.06}          // slightly more responsive than 0.08
          minDistance={1.35}
          maxDistance={12}
          rotateSpeed={tool === 'orbit' ? 0.65 : 0}
          enablePan={tool === 'pan'}
          panSpeed={0.7}
          enableZoom
          zoomSpeed={0.75}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
