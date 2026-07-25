import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  label?: string;
  className?: string;
}

export function GlassButton({ children, onClick, active, label, className = '' }: GlassButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.04 }}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
        active
          ? 'border-accent-400/50 bg-accent-400/20 text-accent-300'
          : 'border-white/8 bg-white/5 text-gaia-50/80 hover:bg-white/10 hover:text-white'
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

export function GlassPanel({ children, className = '' }: GlassPanelProps) {
  return <div className={`glass rounded-2xl ${className}`}>{children}</div>;
}

interface SectionLabelProps {
  children: ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gaia-100/60">
      {children}
    </div>
  );
}

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}

export function Slider({ value, min, max, step, onChange, format }: SliderProps) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1"
      />
      <span className="w-12 shrink-0 text-right font-mono text-[11px] text-gaia-50/70">
        {format ? format(value) : value.toFixed(2)}
      </span>
    </div>
  );
}

interface ToggleProps {
  on: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ on, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="toggle-track shrink-0"
      data-on={on}
      role="switch"
      aria-checked={on}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

interface ToggleRowProps {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
  icon?: ReactNode;
}

export function ToggleRow({ label, on, onChange, icon }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-white/5">
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-gaia-100/70">{icon}</span>}
        <span className="text-[13px] text-gaia-50/90">{label}</span>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}
